# Postcrate — Advanced Feature Requirements

_Companion document to the Product Document v0.1. Working draft._

---

## 1. Document Purpose and Scope

### 1.1 Purpose

This document specifies the advanced feature set proposed for Postcrate beyond the v1.0 core defined in the Product Document. It exists to translate strategic feature thinking into testable, prioritized, and traceable requirements that engineering, design, and product reviewers can act on.

It is a **requirements document**, not a design document. It states _what_ the product must do and _why_, defines acceptance criteria for each requirement, and identifies dependencies, risks, and prioritization. Implementation specifics (which crate, which API shape, which component library) are deferred to design documents written per feature.

### 1.2 Scope

In scope: all features beyond the v1.0 core listed in §9.1 of the Product Document, organized into eight requirement domains.

Out of scope: anything explicitly listed in §9.4 of the Product Document (no accounts, no cloud sync, no team workspaces, etc.), plus the additional non-goals captured in §13 of this document.

### 1.3 Relationship to the Product Document

The Product Document defines the product's vision, principles, v1.0 feature scope, and architecture. This document extends it. Where the two conflict, the Product Document wins on principles and vision; this document wins on detailed feature behavior.

### 1.4 Requirement Conventions

Each requirement is tagged with a stable identifier of the form `FR-<DOMAIN>-<NN>` for functional requirements and `NFR-<DOMAIN>-<NN>` for non-functional. Identifiers do not change once assigned, even if a requirement is later dropped — dropped requirements are marked _Withdrawn_ but retain their ID.

Each requirement carries:

- **Priority.** P0 (must validate before further investment), P1 (must ship by v2.0), P2 (post-v2.0 if signal supports it).
- **Dependencies.** Other requirements or external systems that must exist first.
- **Acceptance criteria.** Concrete, observable conditions under which the requirement is considered met.

The terms _must_, _should_, and _may_ follow RFC 2119 conventions.

### 1.5 Terminology

**Agent** — any AI coding assistant that writes and verifies code on behalf of a developer (Claude Code, Cursor Agent, Devin, Replit Agent, etc.).

**Captured email** — an email message that the Postcrate SMTP listener has received from a sending client and persisted, in memory or on disk, for inspection.

**Mailbox** — a logical inbox bound to a single SMTP port. v1.0 has one mailbox; v1.1 supports many.

**Inbox** — the UI surface that displays captured emails from one or more mailboxes.

**MCP** — Model Context Protocol, the emerging standard for exposing tools to AI agents.

---

## 2. Strategic Context

### 2.1 The Required-Tool Framework

A developer tool becomes durable — _required_ rather than optional — through one of four mechanisms:

1. **Tests fail without it.** The tool is wired into the test suite; removing it breaks CI.
2. **Agents cannot work without it.** The tool exposes capabilities that AI coding agents depend on to close their verification loops.
3. **Frameworks ship it by default.** New project scaffolds assume it is installed.
4. **Single-job excellence.** The tool is so much better at one specific job that not using it feels actively wasteful.

The advanced feature set is biased toward these four mechanisms, with the heaviest weight on the agent angle, where the competitive window is widest in 2026.

### 2.2 Strategic Outcomes

The features in this document collectively pursue three outcomes:

- **Outcome A — Agent-Native.** Postcrate becomes the default SMTP testing tool for AI agents writing email-sending code. This is the most defensible position because no incumbent owns it.
- **Outcome B — Test-Required.** Postcrate is imported into developer test suites and becomes part of the CI loop, not just the local dev loop.
- **Outcome C — SaaS-Displacing.** Postcrate absorbs the most-used 20% of the value of paid email-rendering services (Litmus, Email on Acid) at $0, enough to make adoption a no-brainer for transactional email teams.

Every requirement below maps to one or more outcomes.

---

## 3. AI Agent Integration Requirements

_Maps to Outcome A. This is the highest-leverage domain in this document._

### 3.1 MCP Server

**FR-AI-01 — Bundled MCP server.** Postcrate must include a Model Context Protocol server, bundled with the application, that exposes the inbox to MCP-compatible agents.

- **Priority:** P0.
- **Dependencies:** v1.0 SMTP capture; v1.1 HTTP API (shares storage).
- **Acceptance criteria:**
  - The MCP server starts and stops with the application by default, with a toggle in Settings.
  - An MCP client connecting to the server discovers the tools listed in FR-AI-02 through FR-AI-06.
  - Connection is local-only (loopback) unless the user explicitly opts into LAN exposure, mirroring the SMTP and HTTP API security model.
  - The server is documented in the published docs site with a copy-pasteable configuration snippet for at least Claude Code and Cursor on day one.

**FR-AI-02 — Tool: list_emails.** The MCP server must expose a tool that returns a paginated list of captured emails with metadata (id, from, to, subject, received_at, has_attachments, mailbox_id).

- **Priority:** P0.
- **Acceptance criteria:** The tool accepts optional filters (mailbox, since timestamp, sender, recipient, subject substring). Results are sorted newest-first by default. Pagination parameters are supported.

**FR-AI-03 — Tool: get_email.** The MCP server must expose a tool that returns the full content of a single captured email by id, including parsed headers, plain text body, HTML body, and attachment metadata.

- **Priority:** P0.
- **Acceptance criteria:** Returns a structured object the agent can reason over without further parsing. Large attachments are referenced by id, not inlined, with a separate fetch tool.

**FR-AI-04 — Tool: wait_for_email.** The MCP server must expose a blocking tool that waits for an email matching a predicate (subject pattern, recipient, sender, or arbitrary header match) up to a specified timeout, and returns the matching email or a structured timeout response.

- **Priority:** P0.
- **Acceptance criteria:**
  - Default timeout 30 seconds, maximum 300 seconds.
  - Timeout response includes a list of emails that _did_ arrive in the window but did not match, so the agent can diagnose why its expectation failed.
  - Long-running calls do not block the SMTP listener or the UI.

**FR-AI-05 — Tool: assert_email_matches.** The MCP server must expose a tool that takes an email id and an expected-shape object and returns a structured diff if the email does not match.

- **Priority:** P1.
- **Acceptance criteria:** Supports matching against subject (string or regex), recipients, sender, headers, body substring, body regex, and attachment presence. Returns granular failure information, not just a boolean.

**FR-AI-06 — Tool: clear_inbox.** The MCP server must expose a tool that clears one or all mailboxes, with the same confirmation semantics as the UI action.

- **Priority:** P1.
- **Acceptance criteria:** Requires the agent to pass an explicit `confirm: true` parameter. Logs the clear action in an audit log visible in the UI.

### 3.2 Agent-Friendly CLI

**FR-AI-10 — `wait` subcommand.** The bundled CLI (from Product Document §9.2) must support a `wait` subcommand that blocks until a matching email arrives.

- **Priority:** P0.
- **Dependencies:** FR-AI-04 shares the underlying matching logic.
- **Acceptance criteria:**
  - Flags: `--subject`, `--from`, `--to`, `--header`, `--timeout`, `--mailbox`, `--json`.
  - Exit code 0 on match, non-zero on timeout, with distinct codes for "no email at all" vs. "emails arrived but none matched."
  - `--json` produces structured output suitable for piping to `jq`.

**FR-AI-11 — Structured CLI output.** Every CLI subcommand must support a `--json` flag that emits stable, documented JSON.

- **Priority:** P0.
- **Acceptance criteria:** Schema is documented in the CLI reference. Schema changes follow semantic versioning of the CLI.

### 3.3 Diagnostic Endpoints

**FR-AI-20 — "Did it send?" diagnostic.** The HTTP API and MCP server must expose a diagnostic endpoint that, given a time window, returns either the matching captured email or a structured report of every email that did arrive in that window.

- **Priority:** P1.
- **Acceptance criteria:**
  - Default window is the last 60 seconds; configurable.
  - The "nothing matched" response includes a count of arrivals, their senders and subjects, and the SMTP connection log so the agent can disambiguate "the code didn't try" from "the code tried but addressed it wrong."

### 3.4 Natural-Language Inbox

**FR-AI-30 — Conversational inbox query.** The application must provide a built-in chat interface (accessible via the command palette) where a user can ask natural-language questions about the inbox and receive answers grounded in captured email metadata and content.

- **Priority:** P2.
- **Dependencies:** Requires an LLM call, which means either (a) bundled credentials with rate limiting, (b) user-supplied API key, or (c) a local model. The choice is deferred to a design document.
- **Acceptance criteria:** Sample queries that must work: "show me the password reset email I just got," "find the receipt from Stripe today," "which emails went to alex@example.com this hour." The interface clearly indicates when an LLM is being called and when results are deterministic.

**FR-AI-31 — Command palette upgrade.** The v1.0 command palette must, in this phase, accept free-text queries that fall through to the natural-language inbox query when no command matches.

- **Priority:** P2.
- **Dependencies:** FR-AI-30.
- **Acceptance criteria:** Typing a non-command string into the palette offers a "Search inbox: <query>" action that invokes FR-AI-30.

### 3.5 Inbox-Aware Test Generation

**FR-AI-40 — Generate test from email.** Each captured email must offer a "Generate test" action that emits a test fixture asserting on the email's shape, in the user's chosen target framework (Playwright, Jest, Vitest, Cypress, Pytest, RSpec).

- **Priority:** P1.
- **Dependencies:** FR-TEST-01 (the matcher packages define what a "valid" assertion looks like).
- **Acceptance criteria:**
  - Output is copy-pasteable, idiomatic for the target framework, and exercises subject, recipients, and a representative body assertion.
  - The action is reachable from both the UI and the MCP server (so an agent can generate its own regression tests).

### 3.6 Email-as-Context Export

**FR-AI-50 — Copy as prompt context.** Each captured email must offer a "Copy as prompt context" action that places a structured prompt block on the clipboard.

- **Priority:** P1.
- **Acceptance criteria:**
  - The block contains: subject, parsed headers, plain text body, HTML body (truncated if very large with a length indicator), and a brief frame ("The following is a captured email from the Postcrate inbox.").
  - The format is documented and stable so users can build prompt templates around it.

---

## 4. Testing Infrastructure Requirements

_Maps to Outcome B._

### 4.1 Test Matcher Packages

**FR-TEST-01 — Native test matchers, day-one languages.** Postcrate must publish official, versioned test matcher packages for the following languages on or before the v1.1 release: Node (Jest + Vitest), Python (Pytest), Ruby (RSpec + Minitest), Go (standard testing), PHP (PHPUnit).

- **Priority:** P0.
- **Dependencies:** FR-API-01 (the HTTP API the packages call).
- **Acceptance criteria:**
  - Each package is published on its native registry (npm, PyPI, RubyGems, pkg.go.dev, Packagist).
  - Each package provides an idiomatic matcher in the target framework's style. Reference shape: `expect(inbox).toContainEmail({ to: 'alex@test', subject: /verify/ })` in Node; `assert inbox.contains_email(to='alex@test', subject_matches=r'verify')` in Python.
  - Each package's README contains a quickstart and a link to the Postcrate docs.
  - Package versions track the Postcrate HTTP API version they target.

**FR-TEST-02 — Matcher ergonomics parity.** The matcher packages must offer feature parity across languages for the core assertions: contains-email, count-matches, last-email, no-emails-match.

- **Priority:** P0.
- **Acceptance criteria:** A shared assertion specification is published in the docs. Each language package's documentation maps language-specific syntax to the shared spec.

### 4.2 Per-Test Isolated Mailboxes

**FR-TEST-10 — Programmatic mailbox creation.** The HTTP API and the matcher packages must support creating an ephemeral, isolated mailbox on demand, with its own SMTP port allocated by the server.

- **Priority:** P0.
- **Acceptance criteria:**
  - `createMailbox()` returns a mailbox id, an SMTP host, and an SMTP port.
  - Ports are allocated from a configurable range; allocation failure returns a clear error.
  - Mailboxes have a configurable TTL; mailboxes are auto-deleted after their TTL or when the test process exits if registered.
  - Concurrent parallel tests do not see each other's mail.

**FR-TEST-11 — Test-scoped mailbox helpers.** Each matcher package must provide a helper that creates a mailbox at test setup, exposes it to the test, and cleans it up at teardown.

- **Priority:** P0.
- **Dependencies:** FR-TEST-10.
- **Acceptance criteria:** The helper integrates with each framework's setup/teardown lifecycle (e.g. `beforeEach`/`afterEach`, `pytest` fixtures, `RSpec` `around` blocks).

### 4.3 CI Mode

**FR-TEST-20 — CI binary / image.** Postcrate must publish a `postcrate-ci` distribution — a headless binary and a Docker image — designed for use in CI environments.

- **Priority:** P0.
- **Acceptance criteria:**
  - Cold start to ready-to-accept-mail in under 2 seconds on standard CI hardware.
  - No tray icon, no main window, no autostart, no telemetry.
  - Emits the HTTP API URL and SMTP host:port on stdout in machine-readable form.
  - Image is published to Docker Hub and GitHub Container Registry; the binary is published as a GitHub Releases asset.

**FR-TEST-21 — GitHub Actions setup action.** Postcrate must publish a `postcrate/setup-action` for GitHub Actions that installs and starts Postcrate in CI mode and exports its connection details as environment variables.

- **Priority:** P1.
- **Dependencies:** FR-TEST-20.
- **Acceptance criteria:**
  - Single-line addition to a workflow file: `uses: postcrate/setup-action@v1`.
  - Environment variables set: `POSTCRATE_SMTP_HOST`, `POSTCRATE_SMTP_PORT`, `POSTCRATE_API_URL`.
  - Action is published in the GitHub Marketplace.

### 4.4 Fixture Recording and Replay

**FR-TEST-30 — Capture recordings.** The application must support saving a sequence of captured emails to a `.postcrate` file (format defined in the docs) for later replay.

- **Priority:** P1.
- **Acceptance criteria:** Selecting a range of emails and choosing "Save as recording" produces a single portable file containing the raw SMTP transcripts and parsed metadata.

**FR-TEST-31 — Replay recordings.** The application and the matcher packages must support replaying a recording into a mailbox, reproducing the sequence as if it were live.

- **Priority:** P1.
- **Dependencies:** FR-TEST-30.
- **Acceptance criteria:**
  - Replay preserves relative timing by default; an option fast-forwards to instant replay.
  - The replayed mailbox is indistinguishable from a live one for assertion purposes.

**FR-TEST-32 — Recordings as fixtures.** The matcher packages must support loading a recording file as a test fixture.

- **Priority:** P1.
- **Acceptance criteria:** A test that loads a recording and asserts against it produces the same result on every run, regardless of the machine.

### 4.5 Wait-for-Email Helper

**FR-TEST-40 — Async wait helper.** The matcher packages must provide an idiomatic async wait helper that resolves when an email matching a predicate arrives, or rejects on timeout.

- **Priority:** P0.
- **Dependencies:** FR-AI-04 (shares underlying matching engine).
- **Acceptance criteria:**
  - Default timeout 5 seconds; configurable.
  - Rejection includes the list of emails that arrived but did not match, mirroring FR-AI-04.
  - Helper is documented as the canonical solution to email-test flakiness.

### 4.6 Snapshot Testing

**FR-TEST-50 — Inbox snapshot.** The matcher packages must support snapshot assertions over the inbox state (`toMatchSnapshot` in Jest terminology and its equivalents in other frameworks).

- **Priority:** P2.
- **Acceptance criteria:**
  - Snapshots normalize volatile fields (timestamps, message-ids) so they remain stable across runs.
  - Snapshot diffs are human-readable and identify the specific email and field that drifted.

---

## 5. Multi-Client Rendering Preview

_Maps to Outcome C. Goal: deliver enough of Litmus/Email-on-Acid's value at $0 to make adoption a no-brainer for any team that ships transactional email._

### 5.1 Client Preview Profiles

**FR-RENDER-01 — Profile selector.** The HTML tab of the email detail view must include a profile selector that re-renders the email with the rendering quirks of a chosen client applied.

- **Priority:** P1.
- **Acceptance criteria:**
  - Day-one profiles: Gmail Web, Gmail iOS, Outlook Desktop (Windows), Outlook Web, Apple Mail (macOS), Apple Mail (iOS), Yahoo Mail.
  - Each profile applies a documented set of CSS transformations and content stripping rules that approximate the target client.
  - The profile selector is keyboard-accessible.

**FR-RENDER-02 — Honest fidelity reporting.** Each profile must show a small badge indicating its fidelity level: _high_, _approximate_, or _experimental_.

- **Priority:** P1.
- **Acceptance criteria:** The badge links to documentation explaining what the profile does and does not simulate. The product does not claim pixel perfection it cannot deliver.

### 5.2 Real-Time CSS Linting

**FR-RENDER-10 — Email HTML linter.** Captured emails must be linted against a database of known client incompatibilities, and warnings must be surfaced in the detail view.

- **Priority:** P1.
- **Acceptance criteria:**
  - Day-one warnings include: `<style>` inside `<body>` (Outlook stripping), CSS Grid usage (Gmail), unsupported pseudo-classes per client, web fonts not supported in Outlook, missing fallback fonts.
  - Each warning links to a reference explaining the issue and a suggested fix.

### 5.3 Mobile Preview via QR

**FR-RENDER-20 — On-device preview.** The application must support generating a single-use, signed local URL to view a captured email on another device on the same network, presented as a QR code.

- **Priority:** P2.
- **Acceptance criteria:**
  - URLs expire after a configurable window (default 10 minutes) and are bound to a single email.
  - The local server hosting the URL is off by default and requires explicit per-session opt-in.
  - The feature works without any cloud account, tunnel service, or third-party dependency.

### 5.4 Accessibility Check

**FR-RENDER-30 — A11y linter.** Captured emails must be linted for accessibility, with results surfaced in the detail view.

- **Priority:** P2.
- **Acceptance criteria:**
  - Checks include: color contrast ratios for text over background, presence of alt text on images, semantic heading structure, link text descriptiveness (no "click here").
  - Each finding includes severity (error / warning / info) and a brief remediation note.

### 5.5 Dark Mode Preview

**FR-RENDER-40 — Dark mode toggle.** The HTML tab must include a first-class dark-mode toggle that renders the email under a dark-mode client context.

- **Priority:** P1.
- **Acceptance criteria:**
  - The toggle applies `prefers-color-scheme: dark` to the iframe.
  - A second toggle layers the dark-mode behavior of a specific client profile on top.
  - The product documentation includes a guide on writing dark-mode-safe transactional email.

---

## 6. Scenario Testing Requirements

_"Test the things you currently only find out about in production."_

### 6.1 Bounce Simulation

**FR-SCENARIO-01 — Bounce-marked addresses.** The application must allow marking a recipient address as "hard bounce" or "soft bounce" so that mail sent to it triggers the corresponding SMTP error.

- **Priority:** P1.
- **Acceptance criteria:**
  - Addresses can be added via the UI, the HTTP API, the CLI, and the MCP server.
  - Hard bounce returns a 5xx SMTP response; soft bounce returns a 4xx.
  - The SMTP error responses are configurable per address, with sensible defaults.

### 6.2 Chaos Mode

**FR-SCENARIO-10 — Chaos toggles.** The SMTP server must support a configurable chaos mode that injects controlled failures into accepted connections.

- **Priority:** P1.
- **Acceptance criteria:**
  - Configurable injections: random 4xx rejection (with adjustable probability), random 5xx rejection, artificial response delay, mid-DATA connection drop, malformed response.
  - Chaos is off by default and prominently indicated in the UI when enabled.
  - Chaos settings persist per mailbox so different mailboxes can simulate different conditions in parallel.

### 6.3 Spam Score

**FR-SCENARIO-20 — Spam scoring.** Each captured email must be scored against SpamAssassin-equivalent heuristics, with the score and contributing factors shown in the detail view.

- **Priority:** P2.
- **Acceptance criteria:**
  - Score is computed asynchronously and does not block email display.
  - Contributing factors are listed in plain English (e.g. "Missing List-Unsubscribe header (+1.2)", "High image-to-text ratio (+0.8)").
  - Scoring runs entirely locally — no remote SpamAssassin call.

### 6.4 Deliverability Prediction

**FR-SCENARIO-30 — SPF/DKIM/DMARC alignment check.** The application must inspect captured email headers for SPF, DKIM, and DMARC information and report alignment status.

- **Priority:** P2.
- **Acceptance criteria:**
  - The check explains what each protocol does in one sentence each.
  - Findings indicate whether the email _would_ pass the corresponding check at a typical major receiver (Gmail, Outlook).
  - The feature is honest about its limitations: this is a prediction, not a guarantee.

### 6.5 Link Checking

**FR-SCENARIO-40 — Link scanner.** Each captured email's HTML and text bodies must be scanned for links, with results surfaced in the detail view.

- **Priority:** P1.
- **Acceptance criteria:**
  - Reported issues: broken links (HEAD request 4xx/5xx), `http://` links, links missing expected tracking parameters (configurable patterns).
  - Link checking is opt-in per mailbox to preserve the local-by-default principle. When enabled, it is clearly indicated.
  - Results never leak which email contained which link to any remote service.

---

## 7. Smart Inbox UX Requirements

_Compound UX features that, together, create the "this is the inbox I want to live in" feeling._

### 7.1 Email Diff

**FR-UX-01 — Side-by-side diff.** The application must support selecting two captured emails and viewing a side-by-side diff of subject, headers, HTML source, plain text body, and rendered HTML.

- **Priority:** P1.
- **Acceptance criteria:**
  - The diff is reachable via keyboard (select-with-shift, then a shortcut).
  - The rendered-HTML diff highlights structural differences, not just textual.
  - The diff respects the active client preview profile.

### 7.2 Time-Travel Replay

**FR-UX-10 — Replay to mailbox.** Each captured email must offer a "Replay to mailbox" action that re-sends it through the SMTP server into a chosen mailbox.

- **Priority:** P2.
- **Acceptance criteria:**
  - Replay preserves the raw SMTP transcript exactly.
  - Replay is distinguishable from an original send (a header or a UI badge).
  - The action is also exposed via the HTTP API and MCP server.

### 7.3 Smart Grouping

**FR-UX-20 — Threading.** The inbox must support collapsing related emails (same recipient and similar subject within a short window) into a single threaded row, expandable on click.

- **Priority:** P2.
- **Acceptance criteria:**
  - The grouping algorithm is documented and adjustable in settings (threshold, time window, on/off).
  - Threading is purely visual; the underlying emails remain individually addressable.

### 7.4 Auto-Tagging

**FR-UX-30 — Auto-detected tags.** The application must detect and tag emails as one of: _transactional auth_, _transactional billing_, _transactional notification_, _marketing_, _system_, _unknown_.

- **Priority:** P2.
- **Acceptance criteria:**
  - Detection uses local heuristics on subject, headers, and body — no remote call.
  - Tags appear as filterable chips in the inbox.
  - Users can override or correct tags; corrections persist.

### 7.5 Pinning and Starring

**FR-UX-40 — Pin and star.** Users must be able to pin emails (to keep them visible at the top of the list) and star emails (to mark them as known-bad or noteworthy).

- **Priority:** P2.
- **Acceptance criteria:** Pinned and starred status survives inbox clear; clearing only removes unmarked emails, with a separate explicit "clear all including pinned" action.

### 7.6 Annotations

**FR-UX-50 — Per-email notes.** Each captured email must support a free-text annotation that persists across restarts and survives inbox clear.

- **Priority:** P2.
- **Acceptance criteria:** Annotations are visible in the detail view and indicated in the list view. Annotations are exportable.

### 7.7 Template Inference

**FR-UX-60 — Templates view.** The application must observe captured emails over time and infer their underlying templates, exposed in a sidebar "Templates" view.

- **Priority:** P2.
- **Acceptance criteria:**
  - Inference identifies stable structural elements and variable substitutions.
  - Clicking a template lists all instances; clicking an instance opens the email.
  - The feature is opt-in to avoid surprising users.

### 7.8 Header Explorer

**FR-UX-70 — Interactive header reference.** Each row in the Headers tab must be clickable; clicking reveals a short description, the relevant RFC reference, and an example value.

- **Priority:** P1.
- **Acceptance criteria:**
  - Coverage includes at least all standard RFC 5322 headers and the common authentication headers (Received-SPF, DKIM-Signature, Authentication-Results, ARC-\*, List-Unsubscribe).
  - The reference data ships with the app — no remote call required.

---

## 8. Editor and Ecosystem Integration

_The product wins by appearing where developers already are._

### 8.1 VS Code / Cursor Extension

**FR-ECO-01 — VS Code extension.** Postcrate must publish an official VS Code extension that surfaces inbox state in the editor.

- **Priority:** P1.
- **Acceptance criteria:**
  - Status bar item shows live unread count.
  - A panel inside VS Code shows the inbox list and the detail view.
  - New email arrival can optionally trigger a toast notification (configurable).
  - The extension is also installable in Cursor and forks of VS Code (Codium).

**FR-ECO-02 — Inline `sendMail` annotation (stretch).** The VS Code extension should, where statically detectable, annotate `sendMail`-shaped calls in the active editor with the most recent matching email received by Postcrate.

- **Priority:** P2.
- **Dependencies:** FR-ECO-01.
- **Acceptance criteria:** The annotation is a code lens or inlay hint, language-specific, and is provided for at least Node and Python on initial release.

### 8.2 JetBrains Plugin

**FR-ECO-10 — JetBrains plugin.** Postcrate must publish a JetBrains plugin compatible with at least WebStorm, IntelliJ IDEA, and PyCharm.

- **Priority:** P2.
- **Acceptance criteria:** Feature parity with the VS Code extension's core capabilities (status bar, inbox panel, notifications).

### 8.3 Browser Extension

**FR-ECO-20 — Browser extension.** Postcrate must publish browser extensions for Chrome and Firefox that show inbox unread count and open the inbox in a popover or in the desktop app.

- **Priority:** P2.
- **Acceptance criteria:** The extension communicates with the desktop app's local HTTP API; it is non-functional if the app is not running and indicates this clearly.

### 8.4 Terminal Integration

**FR-ECO-30 — Live tail.** The CLI must support a `tail` subcommand that streams incoming emails in the terminal as they arrive.

- **Priority:** P1.
- **Acceptance criteria:**
  - Output format is configurable: human-readable default, `--json` for machine consumption.
  - Output is pipe-friendly; the command exits cleanly on SIGINT/SIGTERM.
  - `tail --grep <pattern>` filters live.

### 8.5 Raycast and Alfred Extensions

**FR-ECO-40 — Raycast extension.** Postcrate must publish a Raycast extension for inbox search and recent-email actions.

- **Priority:** P2.
- **Acceptance criteria:** Typing a query in Raycast returns matching recent emails; an action opens the email in the Postcrate window.

**FR-ECO-41 — Alfred workflow.** Postcrate should publish an Alfred workflow with parity to the Raycast extension's search capability.

- **Priority:** P2.

### 8.6 Notification Center

**FR-ECO-50 — Click-through notifications.** OS-level notifications for new emails (already specified in the Product Document) must, on click, open the Postcrate window directly to the corresponding email — not just to the inbox.

- **Priority:** P1.
- **Acceptance criteria:** Behavior verified on macOS, Windows, and Linux notification systems where supported. On Linux, graceful degradation when click-through is unavailable.

---

## 9. Adoption and Distribution Requirements

_Mechanisms for becoming the default rather than an option._

**FR-ADOPT-01 — Framework starter inclusion.** Postcrate team must, by v2.0, secure inclusion in the default development configuration of at least three of: create-next-app, Laravel installer, Rails new (default mailer dev settings), Django startproject example settings, NestJS starter, Remix starter.

- **Priority:** P1.
- **Acceptance criteria:** Inclusion takes the form of a documented note in the framework's onboarding ("Install Postcrate to view emails in development") or a default SMTP host/port that matches Postcrate's defaults.

**FR-ADOPT-10 — Mailtrap-compatible API surface.** The HTTP API must include a compatibility mode that mirrors Mailtrap's read API surface, allowing users to swap base URLs and have existing Mailtrap-integrated test code work against Postcrate.

- **Priority:** P1.
- **Acceptance criteria:** Documented mapping table from Mailtrap endpoints to Postcrate endpoints. Integration tests verify the compatibility layer against Mailtrap's published API spec.

**FR-ADOPT-20 — Service partnership documentation.** Provider documentation (Resend, Postmark, SendGrid, Mailgun) must, ideally, reference Postcrate as a recommended local-development option. This requires outreach, not code.

- **Priority:** P2.
- **Acceptance criteria:** At least one major provider links Postcrate in its "local development" or "testing in development" documentation by v2.0.

**FR-ADOPT-30 — Per-framework tutorials.** The docs site must include "How to test email flows" tutorials for at least Next.js, NestJS, Django, Rails, Laravel, FastAPI, and SvelteKit, each a working end-to-end walkthrough.

- **Priority:** P1.
- **Acceptance criteria:** Each tutorial is verified working against the latest stable framework release at publish time and includes a working sample repository.

**FR-ADOPT-40 — Template showcase.** The docs site must host an open-source showcase of well-designed transactional email templates verified to render correctly across all FR-RENDER-01 client profiles.

- **Priority:** P2.
- **Acceptance criteria:** At least twenty templates at launch of the showcase. Each is MIT-licensed and includes attribution metadata. The showcase accepts community submissions via PR.

**FR-ADOPT-50 — Education partnerships.** The project must offer a clear path for bootcamps, courses, and educators to incorporate Postcrate into curricula at no cost, including badges, sample lesson plans, and a contact channel.

- **Priority:** P2.
- **Acceptance criteria:** A `/education` page on the docs site exists and is linked from the README.

---

## 10. Wildcard and Future Considerations

These are bigger bets that could reshape the product or stretch its surface area. They are catalogued here, not committed.

**FR-WILD-01 — Local webhook receiver.** A sibling capability to the SMTP listener, accepting HTTP webhook deliveries and displaying them in a similar inbox UX. _Could be a v3 extension, a sibling product, or a focus risk — explicitly deferred to a future strategy review._

**FR-WILD-02 — Email schema registry.** A configuration file format describing expected email contracts (subject regex, required headers, body shape) that Postcrate validates captured emails against. _Strong fit with the testing direction; warrants its own RFC._

**FR-WILD-03 — Template hot reload.** A directory watcher on the user's templates folder that re-renders the most recently captured email when source changes. _Crosses into IDE territory._

**FR-WILD-04 — Visual template editor.** Inline editing of captured email HTML with live re-render and patch export. _High scope risk; explicitly deferred._

**FR-WILD-05 — Mobile companion app.** Read-only iOS/Android viewer that mirrors the desktop inbox over the local network. _Distinct from FR-RENDER-20 (QR preview), which is per-email and does not require an app._

**FR-WILD-06 — Flow recording for sharing.** Captured email sequences exportable as a shareable replay format (Loom-for-email-flows) for bug reports, support tickets, and design reviews. _Adjacent to FR-TEST-30 but with a different audience._

**FR-WILD-07 — Opt-in observability dashboard.** Anonymized aggregate views of inbox volume, top senders, and template frequency over time. _Must remain strictly opt-in to preserve the local-by-default principle._

---

## 11. Prioritization Summary

If only three requirement domains are validated before further investment, they must be:

1. **§3 — AI Agent Integration.** Specifically FR-AI-01 through FR-AI-06. This is the most defensible position the product can take in 2026 and the only one with no incumbent.
2. **§4.2 — Per-Test Isolated Mailboxes**, combined with FR-TEST-01 (matchers) and FR-TEST-40 (wait helpers). This is the path to making Postcrate a CI dependency.
3. **§5 — Multi-Client Rendering Preview.** Specifically FR-RENDER-01, FR-RENDER-10, and FR-RENDER-40. This is the path to absorbing the most-used 20% of Litmus/Email-on-Acid value.

Each of these addresses a distinct "required tool" mechanism. Landing any one of them well makes the product hard to dislodge; landing all three makes it the obvious default.

The launch story for v2.0 should lead with the agent angle: _the first SMTP testing tool built for agents._ That sentence is unowned in the market today.

---

## 12. Cross-Cutting Non-Functional Requirements

**NFR-PERF-01 — Capture latency.** Time from SMTP DATA completion to email visible in the UI must remain under 200ms on standard developer hardware for emails up to 1MB.

**NFR-PERF-02 — Cold start.** CI mode (FR-TEST-20) cold start to ready must remain under 2 seconds.

**NFR-PERF-03 — Inbox scale.** The UI must remain responsive (interaction latency under 100ms) with at least 10,000 captured emails in a single mailbox.

**NFR-SEC-01 — Network exposure default.** All listeners — SMTP, HTTP API, MCP, browser-extension API, mobile QR preview — must bind to loopback by default. LAN exposure requires explicit per-listener opt-in with a clear UI warning.

**NFR-SEC-02 — HTML sandboxing.** All HTML rendering — direct view, profile preview, mobile preview — must occur in a sandboxed iframe with `sandbox="allow-same-origin"` only. No requirement in this document overrides this.

**NFR-PRIV-01 — Local-only feature defaults.** Any feature that could in principle make a network request to a third party (spam scoring, link checking, deliverability prediction, accessibility checking) must run locally by default. Any remote-capable variant must be opt-in and clearly disclosed.

**NFR-PRIV-02 — No telemetry.** No requirement in this document adds telemetry. The product's no-telemetry stance from the Product Document is preserved without exception.

**NFR-PLAT-01 — Platform parity.** Every functional requirement in this document, unless explicitly platform-scoped, must be delivered on macOS, Windows, and Linux at the same release. There is no "macOS first, Windows later."

**NFR-PLAT-02 — CLI parity.** Every action exposed through the GUI that has a sensible non-interactive equivalent must also be available through the CLI, with the same options and stable JSON output.

**NFR-A11Y-01 — Keyboard operability.** Every requirement in this document that introduces a UI element must be operable from the keyboard alone, consistent with the keyboard model in Product Document §10.5.

---

## 13. Non-Goals

In addition to the Product Document's non-goals (§9.4), the following are explicitly out of scope for this document's feature set:

- No live email-sending capability to real recipients beyond the optional "Release to real address" feature in Product Document §9.3. This document does not extend that capability.
- No multi-user team workspaces, shared inboxes, or remote sync, even as part of CI mode.
- No bundled LLM weights for the natural-language inbox (FR-AI-30); the implementation must use a local-or-supplied-key strategy, not ship a model.
- No proprietary fixture format that locks users in; FR-TEST-30's recording format must be specified, documented, and parseable by anyone.
- No competitive feature-for-feature parity with Litmus or Email on Acid. The product targets the 20% that delivers 80% of the value, honestly labeled (FR-RENDER-02).

---

## 14. Dependencies

External dependencies that the requirements above assume:

- A stable Model Context Protocol specification, or willingness to track a moving specification through v2.0.
- An EV or OV code-signing certificate (already a Product Document risk) — no new dependencies added here.
- Continued maintenance of the SMTP server crate chosen in Product Document §12.2; chaos-mode requirements (FR-SCENARIO-10) may force a migration to `samotop` earlier than originally planned.
- Continued health of the matcher framework ecosystems (Jest, Vitest, Pytest, RSpec, Go test, PHPUnit). Major rewrites by any of these would cascade into FR-TEST-01 maintenance.

Internal dependencies, summarized:

- FR-AI-\* depends on FR-API-01 (the HTTP API, originally a v1.1 requirement). Any slip in the HTTP API slips the entire AI Agent domain.
- FR-TEST-\* depends on FR-API-01 and FR-TEST-10.
- FR-RENDER-\* depends on FR-RENDER-01 as its foundation; the other rendering features layer on top.

---

## 15. Risks

**Risk 1 — MCP standard volatility.** MCP is young in 2026. Building heavily on it carries a tracking-cost risk. _Mitigation:_ keep the MCP server thin, with the real logic in the HTTP API, so a protocol shift affects only the adapter layer.

**Risk 2 — Test matcher maintenance burden.** Shipping matcher packages in five languages (FR-TEST-01) means five publishing pipelines, five sets of tests, and five potential breakage surfaces with framework upgrades. _Mitigation:_ start with Node and Python; add others only when there is signal demand.

**Risk 3 — Rendering profile credibility.** A profile that claims to simulate Outlook 2007 but does so poorly damages trust. _Mitigation:_ FR-RENDER-02 (honest fidelity badges) is non-negotiable; ship fewer profiles at higher fidelity rather than more at lower.

**Risk 4 — Scope creep from wildcards.** §10 contains items that, if pursued opportunistically, will dilute the product. _Mitigation:_ require an explicit RFC and a strategic-fit argument before promoting any wildcard from §10 into a numbered domain.

**Risk 5 — Adoption requires outreach, not just code.** FR-ADOPT-01 (framework starter inclusion), FR-ADOPT-20 (provider docs), and FR-ADOPT-30 (tutorials) require sustained partnership and content work, not implementation. _Mitigation:_ budget a real portion of post-v1 effort for non-engineering work; do not treat adoption as a side effect of shipping features.

**Risk 6 — Brand promise of "local by default" under pressure.** Several features in this document touch the boundary (link checking, deliverability prediction, mobile preview, partnerships). Each one is a chance to leak the local-by-default promise. _Mitigation:_ NFR-PRIV-01 is a hard constraint; review every new feature against it.

---

## 16. Open Questions

Carrying forward from the Product Document, with additions specific to this document:

- Which MCP host(s) does the v2.0 release officially support and document? At minimum, Claude Code and Cursor; should Continue.dev, Cline, and Aider be included on day one?
- Does the natural-language inbox (FR-AI-30) ship with the v2.0 release or is it deferred to a later milestone?
- Which framework receives the first official starter integration (FR-ADOPT-01)? Outreach must begin three months before the integration ships.
- Who owns the rendering profile database (FR-RENDER-01)? Maintaining the CSS-quirk catalog is ongoing work; can it be community-curated?
- Is the matcher package layer maintained in the same repo as the core (monorepo) or split (multi-repo)? Affects velocity and release coordination.

---

## 17. Acceptance Summary

This document is considered correctly implemented when, in aggregate:

- All P0 requirements have shipped, are documented in the public docs site, and have at least one tutorial or example in their respective domain.
- A developer can install Postcrate, wire it into an AI coding agent in under five minutes, and have the agent successfully complete a multi-step email verification flow against captured email — end-to-end, without manual intervention.
- A developer can install Postcrate's test matcher in their preferred language, write a test that creates an isolated mailbox and asserts on a captured email, and have that test run reliably in both local development and GitHub Actions CI.
- A developer working on a transactional email template can open it in Postcrate, switch between at least five client preview profiles, see real CSS warnings for known-incompatible patterns, and toggle dark mode — without paying for any external service.

Meeting these three criteria validates the strategic bets in §2.2 and earns the right to invest in the remaining requirement domains.

---

_End of document. This document should be reviewed every two releases against the prioritization in §11; requirements that have not produced signal within two release cycles after shipping are candidates for withdrawal or rework._
