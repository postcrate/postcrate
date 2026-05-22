# postcrate

[![version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)](https://github.com/postcrate/postcrate/releases)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![macOS](https://img.shields.io/badge/macOS-supported-success?style=flat-square)]()
[![windows](https://img.shields.io/badge/Windows-planned-lightgrey?style=flat-square)]()
[![linux](https://img.shields.io/badge/Linux-planned-lightgrey?style=flat-square)]()

Postcrate is a desktop SMTP capture tool for developers. It runs a real mail server on a port you choose, accepts the messages your applications send, and presents them in an inbox engineered for the way email is actually debugged. The entire system runs on your machine; nothing leaves it unless you configure a forwarding rule or a webhook.

The product targets a specific gap. Most teams reach for a hosted capture service like Mailtrap or for a containerized inbox like MailHog. Hosted services solve the inbox problem but route your development mail through someone else's infrastructure. Containerized inboxes keep traffic local but stop where capture ends: they show you that mail arrived without telling you whether it would render correctly in Gmail, whether DKIM verifies, or whether your list-unsubscribe is RFC-compliant. Postcrate is the option in between. A first-class native inbox with the analytical depth of a deliverability vendor, with no account, no SaaS, and no network egress.

The current release runs on macOS. Windows and Linux builds compile from source today and will ship as signed binaries in the next release.

---

## What it does

A postcrate mailbox is a long-running SMTP listener bound to a localhost port. You can create as many as you want, with persistent or ephemeral semantics, and the engine will keep them running across app restarts. Each mailbox speaks a complete dialect: EHLO with extension advertisement, opportunistic STARTTLS, AUTH PLAIN and LOGIN, SMTPUTF8 (RFC 6531) and 8BITMIME (RFC 1652) envelope handling, and PIPELINING for clients that batch commands. The full session, from `220` greeting to `221` close, is captured as a textual transcript and persisted alongside the message so the wire-level behavior of any test run can be reconstructed later.

Captured messages flow through an ingest pipeline that performs MIME parsing, attachment extraction, link enumeration, header normalization, and indexing for full-text search. The result is a row in the inbox plus a set of derived artifacts (raw `.eml`, parsed JSON, attachment blobs, session transcript) on disk. The inbox is read-mostly and re-renders live as events flow from the engine.

## Inspection

Every captured message can be analyzed without leaving the inbox. The inspection tab runs four passes locally and surfaces them as a stack of report cards.

The **spam report** assigns a calibrated heuristic score using a rule set that mirrors the most-cited SpamAssassin heuristics: subject-line ALL_CAPS density, suspicious unicode in From addresses, link/text ratio, MIME multipart imbalance, and missing or implausible identification headers. Each contributing rule is listed with its individual score so you can defend the verdict.

The **authentication report** verifies SPF, DKIM, and DMARC against the headers present on the message itself. SPF is evaluated by parsing the `Received-SPF` chain plus the `Authentication-Results` header from the captured envelope, not by performing a live DNS lookup, because postcrate is offline by contract. DKIM is verified canonically against the public key the message claims to be signed under. DMARC alignment is computed from the verified results.

The **link report** enumerates every URL the message contains, classifies it (insecure HTTP, mailto, telephone, tracking redirect), and flags the patterns that commonly trigger inbox provider warnings: link shorteners, mismatched display text, and unbalanced HTTP/HTTPS schemes within the same message.

The **list-unsubscribe report** verifies both header forms (`List-Unsubscribe`, `List-Unsubscribe-Post`) and the one-click variant. It reports whether the URI is reachable in principle (well-formed, correctly scoped), validates against the modern compliance shape required by Gmail and Yahoo for bulk senders, and surfaces findings inline.

## Rendering

The render tab compiles the message HTML against client-specific profiles that approximate how major inbox providers transform email at delivery time. Profiles include Gmail Web, Gmail iOS, Outlook Desktop, Outlook Web, Apple Mail on macOS, Apple Mail on iOS, and Yahoo Mail. Each profile is annotated with a fidelity rating (high, approximate, experimental) so the rendering's reliability is never implicit. The compiled HTML is presented in a sandboxed iframe that respects the profile's dark mode preference and image loading policy.

Two passes accompany the render: an HTML lint that calls out properties that the active profile silently rewrites or drops, and an accessibility audit that flags the issues a screen-reader user would encounter (insufficient color contrast, missing alt text, structural landmarks).

## Scenarios

Production mail behaves differently than development mail. Scenarios let you reproduce the conditions where bugs surface.

**Chaos mode** injects randomized faults into a mailbox: connection delays sampled from a configurable distribution, transient SMTP rejections (`421` responses), and dropped sessions mid-DATA. When chaos is active, the inbox surfaces a banner so it is never ambiguous whether the current behavior is real or injected.

**Bounce rules** make the server return chosen SMTP responses for messages that match a pattern. Match on recipient regex, header equality, or body substring; respond with the SMTP reply code of your choice (`550`, `552`, `421`, anything). Used together with chaos, bounce rules exercise your retry logic against the kinds of failures real upstreams produce.

## Forwarding, webhooks, recording

**Forwarding rules** relay matched mail upstream to a real SMTP server. Each rule scopes globally or to a single mailbox, can be enabled or disabled without deletion, and supports multiple target addresses per relay. Delivery failures are logged.

**Webhooks** POST every captured email to a URL of your choice. The payload is a stable JSON envelope of the parsed message. An optional `Authorization` header is sent verbatim if configured. Failed deliveries appear in the logs and in the notifications surface.

**Recording and replay** is an explicit affordance for reproducing bugs. Any mailbox can be exported to a JSON file containing the full set of captured envelopes. The file can be replayed into any other mailbox; the engine re-injects each envelope through the same ingest pipeline, which means downstream side effects fire identically. The recording format is stable and versioned.

## Architecture

The project is split across two repositories with a strict dependency direction. The engine, [`postcrate/postcrate-core`](https://github.com/postcrate/postcrate-core), is a Rust crate with no UI dependencies. It owns the SMTP server, ingest pipeline, SQLite storage, scenarios, forwarding, webhooks, and analysis engines. The desktop shell, this repository, is a Tauri 2 application written in React 19 and TypeScript. The shell imports the engine as a Rust dependency; the engine knows nothing about the shell.

Communication between the two halves uses Tauri IPC with [tauri-specta](https://github.com/oscartbeaumont/tauri-specta) so every command and event is fully typed end to end. The shell does not call any HTTP API of its own; every IPC call resolves to a generated TypeScript function with the engine's exact `Result` type as its return.

The shell's state management splits cleanly along two axes. SWR backs all engine-derived data (mailbox lists, message details, audit entries, settings). Zustand backs UI-only state (current project, current mailbox, dialog visibility). Engine events drive SWR cache mutations via a set of `*Sync` hooks mounted at the root layout, which means the inbox updates live without any polling. The same architecture lets two windows (main and preferences) observe the same engine state without coordination.

Data persists in `~/Library/Application Support/dev.postcrate.app/` on macOS. The directory contains a single SQLite database holding mailboxes, messages, audit entries, and configuration, plus flat-file blobs for raw `.eml` artifacts, attachments, and SMTP transcripts. The directory is portable, removable, and not synchronized to any cloud.

```
postcrate/
├── postcrate/             ← desktop shell (Tauri 2 + React 19 + TypeScript)
│   ├── src/
│   │   ├── components/    ← shared UI: sidebar, top bar, command palette
│   │   ├── data/          ← static nav metadata
│   │   ├── hooks/         ← app-level hooks (theme, etc.)
│   │   ├── lib/           ← IPC bridge, fetcher, utilities
│   │   ├── pages/         ← routed screens
│   │   ├── services/      ← SWR hooks + IPC actions + engine event subscriptions
│   │   ├── stores/        ← zustand stores (UI state, projects, view, prefs)
│   │   └── styles/        ← Tailwind entry
│   └── src-tauri/         ← Rust bindings, commands, generated bindings
│
└── postcrate-core/        ← engine (Rust crate)
    └── crates/postcrate-core/src/
        ├── db/            ← SQLite schema, migrations, queries
        ├── smtp/          ← listener, session, response writer
        ├── mailbox/       ← mailbox lifecycle, port allocation
        ├── pipeline/      ← ingest, parse, transcript persistence
        ├── scenarios/     ← chaos, bounce evaluation
        ├── rendering/     ← profile compiler, lint, a11y
        └── service.rs     ← public surface; what Tauri commands call
```

## Privacy posture

Postcrate is local-first by contract. The engine does not perform any network egress unless a forwarding rule, webhook, or updater check is explicitly configured. All analysis heuristics (spam scoring, link audit, SPF/DKIM/DMARC verification, list-unsubscribe validation, render compilation, lint, a11y) run on captured bytes alone, with no live DNS, no RBL queries, no telemetry. There are no analytics SDKs and no crash reporting service.

The auto-updater, when binaries ship, will check a single JSON manifest at a known URL on a one-hour cadence. The check itself is logged in the audit log and can be disabled.

## Installation

Signed binaries are not yet published. The next release will ship a notarized macOS `.dmg` via GitHub Releases and a Homebrew Cask. For the moment, build from source (see [Development](#development)).

Once binaries are available, the auto-updater is wired through Tauri's signed updater plugin. Released bundles are verified against an Ed25519 public key embedded in the binary; the engine refuses to install any update that does not verify.

## Development

Prerequisites are Rust (latest stable), Node.js 20 or later, pnpm 9 or later, and the platform build dependencies that Tauri lists in its [prerequisites guide](https://v2.tauri.app/start/prerequisites/).

The engine and shell live in sibling repositories that share a parent directory. Clone both:

```bash
mkdir postcrate && cd postcrate
git clone git@github.com:postcrate/postcrate.git
git clone git@github.com:postcrate/postcrate-core.git
cd postcrate
pnpm install
pnpm tauri dev
```

The first build compiles the engine and takes several minutes. Subsequent runs are incremental.

Scripts:

```bash
pnpm dev                 # Vite-only; UI iteration without the Tauri shell
pnpm tauri dev           # Full desktop app, hot-reloaded
pnpm tauri build         # Production bundle
pnpm tsc --noEmit        # Type check
pnpm lint                # ESLint
pnpm lint --fix          # Autofix
```

When you add or modify a Tauri command on the engine side, regenerate the TypeScript bindings:

```bash
cd src-tauri
cargo test --features generate-bindings
```

This rewrites `src/lib/bridge/bindings.ts` with the new command and event signatures. The IPC layer becomes a TypeScript compile error if a frontend caller drifts from the engine's contract.

Code style is enforced by ESLint with a strict import-order rule. Run `pnpm lint --fix` before committing.

## Roadmap

Concrete deliverables, in priority order.

| Item | State |
|------|-------|
| Signed and notarized macOS binary release with auto-update | In progress |
| Homebrew Cask | Pending macOS release |
| Windows MSI and Linux AppImage with code signing | Planned |
| MCP server exposing the inbox to local AI agents | Engine work pending |
| Hits column on bounce rules with reset action | Engine work pending |
| Live SMTP session log sidebar | Engine work pending |

## License

[MIT](LICENSE).
