# Product Document — Native SMTP Testing App for Developers

*Version 0.1 · Working draft*

---

## 1. Executive Summary

This is a cross-platform desktop application that runs a local SMTP server in the background and gives developers a beautifully designed inbox for the mail their applications send while they build and test. It is the spiritual successor to Mailpit and MailHog, repositioned for developers who want a native experience instead of yet another browser tab and yet another Docker container.

The product is built with Tauri (Rust backend, web frontend), distributed as native binaries for macOS, Windows, and Linux, and lives in the system tray. It launches with the user's session, stops cleanly when closed, and requires zero configuration to capture its first email.

It is positioned as an open-source project intended to function both as a daily-use developer tool and as a portfolio-grade public artifact.

---

## 2. Vision

Email testing tools today fall into three buckets, and none of them feel made for the modern developer. CLI servers like Mailpit are powerful but treat the UI as an afterthought. SaaS offerings like Mailtrap require accounts, internet access, and send your test data over the wire. Old desktop apps like smtp4dev and Papercut work but feel like they were designed in 2014.

There is no Linear-grade, Raycast-grade, TablePlus-grade tool for local email testing. The vision is to build it.

The product should feel like something a developer wants open during work, not something they tolerate when debugging is necessary.

---

## 3. The Problem

Every backend developer who has ever shipped a sign-up flow, a password reset, a transactional notification, or a billing receipt has needed to inspect outgoing email during development. The current options all carry friction.

Running Mailpit or MailHog locally means managing a Docker container or a binary process, remembering its port, and keeping a browser tab pinned next to fifteen others. The UI loads in the same context as documentation, Stack Overflow, and Slack, so it gets lost.

Using a SaaS like Mailtrap means signing up, sharing credentials with teammates, sending production-shaped data to a third party, and depending on a network connection during local development. For solo developers it is overkill, for some teams it is a compliance issue.

Using a real inbox (Gmail, a catch-all domain) means polluting that inbox, risking accidental sends to real recipients, and dealing with deliverability quirks that have nothing to do with the bug you are actually debugging.

The underlying job is simple: *catch outgoing email from my app, show it to me, let me inspect it.* The current tools either over-serve this job, under-design it, or both.

---

## 4. Target Users

The primary user is the working backend or full-stack developer who writes software that sends email. They use Node, Python, Ruby, Go, PHP, or Rust. They build with frameworks like Django, Rails, Laravel, Next.js, NestJS, and FastAPI. They send transactional mail through SMTP libraries, through services like Resend or SendGrid that offer dev modes, or through framework-native mailers.

A secondary user is the frontend developer or designer who works on transactional email templates and needs to preview rendering across viewports.

A tertiary user is the QA engineer or test author who wants to assert on email content during end-to-end testing and needs an HTTP API to query captured messages.

The product is not built for non-technical users, for marketers managing campaigns, or for production email infrastructure. It is a development tool.

---

## 5. Competitive Landscape

**Mailpit** is the strongest competitor. Written in Go, single binary, has a usable web UI, has an HTTP API, supports Chaos Mode for failure simulation. Its weakness is that it is a browser-tab experience and requires the user to manage a process. It is the feature bar to match.

**MailHog** is Mailpit's predecessor. Mostly unmaintained, similar shape, weaker UI.

**Mailtrap** is the SaaS standard. Polished, multi-tenant, supports teams. Requires sign-up, network access, and trust.

**Ethereal** is a free disposable SMTP service. Useful for one-off testing, not for sustained development.

**smtp4dev** is a .NET desktop app. Windows-first, has a tray icon, but the UI is dated and cross-platform support is uneven.

**Papercut** is a Windows-only tray app. Simple, has a small following, has not been seriously redesigned in years.

**MailCatcher** is a Ruby gem, beloved by Rails developers, lightweight, but visually frozen in time.

The opportunity sits in the gap between Mailpit's feature depth and the design polish of modern developer tools. No competitor today is trying to be both technically respectable and visually delightful. That is the wedge.

---

## 6. Positioning

The one-line positioning statement:

> *A native, cross-platform desktop inbox for the mail your apps send during development. Zero config, beautifully designed, open source.*

The product is positioned against Mailpit on experience, not features. It will not initially match Mailpit's feature breadth and should not try to. It will match Mailpit's feature *bar* — the things developers actually use — and beat it on everything that touches the user directly: install flow, first-run experience, visual design, keyboard interaction, framework integration guidance, and the feeling of using it daily.

The README headline should not say "another SMTP testing tool." It should say something closer to "the SMTP tool you'll want to keep open."

---

## 7. Product Principles

These principles exist to make feature decisions easier when the inevitable feature-creep pressure arrives.

**Zero config to first email.** Launch, send, see. No setup wizard, no port-picking dance, no documentation required for the first thirty seconds. If a user cannot capture their first email within a minute of installation, the product has failed at its core promise.

**Native everywhere, equally.** macOS is not the first-class platform with Linux as an afterthought. All three platforms get signed, packaged, properly distributed builds. Linux users get AppImage, .deb, and an AUR package. Windows users get an MSI and Scoop. macOS users get a signed .dmg and a Homebrew cask.

**Beautiful enough to keep open.** This is a tool developers stare at for hours when debugging email flows. Visual quality is a feature, not decoration. The bar is Linear, Raycast, TablePlus — not Bootstrap admin templates.

**Keyboard first, mouse welcome.** Power users live on keyboards. Every action that takes more than a click should have a shortcut. A command palette is mandatory.

**Local by default, private by design.** No telemetry by default. No cloud sync. No account. The data captured belongs to the user and lives on their machine.

**Open source, openly developed.** Public roadmap, public discussions, MIT or Apache 2.0 license, contributors welcome, conventional commits, clear contribution guidelines.

**Small surface, sharp edges.** The product does one thing extremely well. Feature requests that drift toward "email QA platform" or "team collaboration tool" are politely declined.

---

## 8. Naming Direction

The product needs a name before it ships. The name should be short, memorable, ideally available as a .dev or .app domain, and not conflict with existing developer tools. A few directions worth exploring:

The *mail-prefix* convention (Mailpit, MailHog, MailCatcher) is established but crowded. Going with it signals familiarity but risks blending in. Candidates in this direction: **Maildock**, **Mailtray**, **Mailbase**, **Mailcrate**.

The *metaphor* direction picks a single evocative word. Candidates: **Pigeon** (mail carrier, light, memorable), **Stamp** (short, punchy), **Trapdoor** (clever wordplay on "mail trap"), **Letterbox** (clear and warm), **Postcrate** (Rust-coded, container-shaped).

The *abstract* direction picks a coined or oblique name that earns meaning through use. Riskier for a portfolio project where discoverability matters.

Recommendation: pick a metaphor name. **Postcrate** and **Pigeon** are the strongest candidates. Postcrate signals Rust without being on the nose, has a clear conceptual frame (a crate where mail lands), and is almost certainly available across registries. Pigeon is shorter, more memorable, and works visually as a mark — but is more likely to have collisions.

The doc will use *[Product]* as a placeholder for the rest of this document.

---

## 9. Feature Scope

### 9.1 Version 1.0 — what ships first

The first release must do the core job and feel finished. Anything else can wait.

**SMTP server.** Local SMTP listener on a configurable port, default 1025. Accepts mail from any client, no authentication required by default, binds to 127.0.0.1 only. Supports the SMTP commands required for typical client libraries to work without errors: HELO/EHLO, MAIL FROM, RCPT TO, DATA, RSET, NOOP, QUIT.

**Inbox.** A list of captured emails sorted by received time, newest first. Each row shows sender, recipients (truncated if many), subject, a one-line preview, and a relative timestamp. Unread emails are visually distinguished.

**Email detail view.** Four tabs: rendered HTML (sandboxed iframe, scripts blocked), plain text, raw RFC 5322 source, and parsed headers. Attachments listed with size and content type, downloadable individually.

**Search.** A single search input that filters across sender, recipient, subject, and body. Live filtering as the user types. Keyboard shortcut to focus the search input.

**Server status.** A pill in the top bar showing the listener state (running on port X, stopped, error). Clicking it toggles the server.

**Tray icon.** Always present when the app runs. Badge shows unread count. Menu items: Show window, Server running/stopped (toggle), Unread count (informational), Clear inbox, Quit.

**Settings.** A small panel covering SMTP port, launch at login, theme (system/light/dark), inbox retention (number of emails or days), and notification preferences.

**Notifications.** Optional OS-level notification when a new email arrives. Off by default to avoid surprise.

**Keyboard navigation.** Arrow keys and j/k to move through the list. Enter to open. `/` to focus search. `cmd/ctrl+k` for a small command palette. `cmd/ctrl+,` for settings. `cmd/ctrl+shift+delete` to clear inbox.

**Send a test email.** A button somewhere in the UI that sends a sample email to the local server so the user sees something immediately on first launch.

**Theme.** Light and dark, following the operating system by default, manually overridable.

### 9.2 Version 1.1 — quick follow-ups

The first round of additions, shipped within a few weeks of v1.

**Multiple mailboxes.** Several SMTP listeners on different ports, each shown as a separate inbox in the sidebar, color-coded. The killer feature for developers juggling multiple projects.

**HTTP API.** A small read-only API on a separate port (default 8025) that returns captured emails as JSON. Endpoints: list, get by id, get raw, search, delete. Enables E2E test integration.

**Tiny CLI.** A bundled command-line tool (`[product] latest`, `[product] clear`, `[product] count`) for scripting and headless contexts.

**Viewport preview.** In the HTML tab, a toggle to render the email at desktop, tablet, and mobile widths. Useful for transactional email design.

**Framework integration cards.** First-run experience shows tabs for popular frameworks (Node/Nodemailer, Python/SMTPLib, Django, Rails ActionMailer, Laravel, Next.js, Resend dev mode, etc.) with the exact configuration snippet to point the framework at the local server. Copy button on each snippet.

### 9.3 Version 2.0 — bigger bets

Later releases, once the foundation is solid and there is real usage.

**Spam analysis.** Run captured emails through SpamAssassin-equivalent heuristics and show a score. Helpful for transactional senders worried about deliverability.

**Link checking.** Scan all links in captured emails and flag broken ones, missing tracking parameters, or insecure URLs.

**Release to real address.** Optional forwarding of a captured email to a real inbox for staging-style workflows. Confirmation required per send to prevent accidents.

**Authentication and TLS.** Optional SMTP AUTH and STARTTLS for cases where developers need to test those code paths.

**Chaos mode.** Simulate failures: random rejections, slow responses, malformed responses. Matches a Mailpit feature.

**Persistence and export.** SQLite-backed history that survives restarts, with an option to export inboxes as .mbox or .eml archives.

### 9.4 Explicit non-goals

These are off the table for the foreseeable future, regardless of how many people ask. Saying no early is what keeps the product sharp.

No user accounts. No cloud sync. No team workspaces. No shared inboxes across machines. No production email sending. No integrated email marketing features. No webhook receivers for non-SMTP integrations. No native mobile apps. No paid tier, at least until there is a real reason for one.

---

## 10. User Experience

### 10.1 First run

When the user opens the app for the first time, three things should happen in sequence and feel like one moment.

The SMTP server starts automatically on the default port. The main window opens to an empty-state screen that explains what is happening: *"Listening for mail on localhost:1025."* Below that, a section with framework tabs shows how to configure the user's stack to send to it. A prominent button reads *"Send me a test email,"* and clicking it injects a sample email so the user immediately sees the populated state.

There is no setup wizard. There is no required configuration. There is no documentation pop-up. The product explains itself by working.

### 10.2 Daily use

The user typically interacts with the product in two modes.

**Tray mode.** Most of the time the window is closed and the app lives in the tray. The user is coding in their editor, their app sends a mail, a tray notification appears, the badge count increments. The user clicks the tray icon, the window opens, they read the email, and they close the window. This loop should be smooth and silent.

**Window mode.** When actively debugging an email flow, the user keeps the window open beside their editor. They re-send mail from their app, the inbox updates live, they click into the new message, switch to the HTML or Headers tab as needed, and iterate. No reloading, no refreshing, no manual polling.

### 10.3 The shell

The window itself is laid out as three vertical regions.

A collapsible left sidebar shows mailboxes (just one in v1, several in v1.1) with unread counts. Below mailboxes, a small section for filters or saved searches once those exist.

A middle column shows the email list for the active mailbox. Each row is compact but breathable: sender on top, subject below, a faint preview line, a timestamp on the right.

A right pane shows the selected email. A small header strip names the sender, recipients, subject, and date. Below it, a tab bar for HTML, Text, Raw, Headers. Below that, the content area. Attachments appear in a strip at the bottom of the header strip when present.

A thin top bar runs across the whole window with the server status pill on the left, the search input in the center, and a small icon cluster (settings, command palette, theme toggle) on the right.

### 10.4 Tray menu

The tray is for control, not for content. The menu should be short:

A status line showing the server state and port. A toggle to start or stop the server. A line showing unread count. *Show window.* *Clear inbox.* *Settings.* *Quit.*

That is enough. Resist the urge to show a mini inbox in the tray menu.

### 10.5 Keyboard model

The product should be entirely operable from the keyboard.

Within the inbox: `j` and `k` or arrow keys to move between emails. `Enter` to focus the detail view. `Escape` to return focus to the list. `1`, `2`, `3`, `4` to switch tabs in the detail view. `/` to focus search. `Shift+J` and `Shift+K` to scroll the detail view without losing list focus.

Global: `cmd/ctrl+k` opens the command palette. `cmd/ctrl+,` opens settings. `cmd/ctrl+r` toggles the server. `cmd/ctrl+shift+delete` clears the inbox with a confirmation. `cmd/ctrl+w` hides the window (does not quit).

The command palette is small but signals craft. It surfaces actions like "Clear inbox," "Stop server," "Toggle theme," "Open settings," "Send test email," and any future actions. Even with five items, it should exist.

---

## 11. Visual Design Direction

The reference points are Linear, Raycast, TablePlus, and Arc. The aesthetic is restrained, dense without feeling crowded, typographic, and committed to a single accent color rather than a rainbow.

**Typography.** System font stack: SF Pro on macOS, Segoe UI Variable on Windows, Inter as a fallback on Linux. Body copy at 13 or 14 pixels. Generous line-height (1.5–1.6) in the email viewer specifically, tighter elsewhere. Tabular numerals for timestamps and counts.

**Color.** A neutral surface palette (true white or true black is rare; both have a slight cast). One accent color picked carefully and used consistently — possibly a deep blue, possibly a desaturated green, possibly something more distinctive depending on the brand direction. Status colors are conventional: green for running, red for error, amber for warning.

**Spacing.** A consistent spacing scale (4, 8, 12, 16, 24, 32, 48). Hairline dividers (1px, low opacity) instead of card boxes wherever possible. The product should feel like one continuous surface, not a grid of boxes.

**Iconography.** A single icon set used everywhere. Lucide is a strong default; Phosphor and Tabler are alternatives.

**Density.** Compact but not crowded. Email list rows around 56–64 pixels tall. The detail view content area generous, with email content given room to breathe.

**HTML email rendering.** Captured HTML emails must be sandboxed. They render in an iframe with `sandbox="allow-same-origin"` only — no script execution, no top-level navigation, no form submission. The viewport-preview toggle in v1.1 wraps the iframe in a container with constrained width.

**Empty states.** The empty inbox is not a blank canvas. It explains what the app is listening for, shows framework setup snippets, and offers the test-email button. Empty states are onboarding surfaces.

**Motion.** Subtle and functional. New emails fade in at the top of the list. Tab switches in the detail view are instant or near-instant. No sliding panels, no springs, no decorative animation. The product is for working developers, not for demo videos.

---

## 12. Technical Architecture

### 12.1 Stack

**Tauri 2** as the application framework. Smaller binaries than Electron, native webview rather than bundled Chromium, Rust backend by default.

**Rust** for the backend: SMTP server, mail parsing, storage, IPC commands.

**TypeScript** for the frontend, with **React** or **Svelte** or **SolidJS** depending on team preference. SolidJS is the most performant and produces the smallest bundles, React has the deepest ecosystem, Svelte sits between. For a portfolio project, SolidJS or Svelte will signal taste.

**Tailwind CSS** for styling, with a small custom design system on top. Avoid component libraries that come with their own visual identity (Material UI, Chakra) — they will fight the design direction.

**Vite** for the frontend build. Tauri's default.

### 12.2 SMTP layer

Two reasonable choices for the SMTP server crate.

**`mailin-embedded`** is the simpler option. Implements the `Handler` trait, gets callbacks for HELO, MAIL, RCPT, DATA, DATA_END. Good for a Mailpit-style sink. Synchronous, so it runs in a dedicated thread.

**`samotop`** is more powerful, fully async (Tokio-native), supports STARTTLS, more configurable. Worth considering if v1 plans include TLS or if integration with the rest of the Tokio runtime matters.

Recommendation: start with `mailin-embedded` for v1 because the velocity gain outweighs the architecture purity, and migrate to `samotop` if TLS or async needs arrive.

For mail parsing, **`mail-parser`** is the standard choice. It parses raw RFC 5322 into a structured representation: headers, body parts, attachments, inline images, MIME boundaries. It handles the messy real-world cases well.

### 12.3 Storage

For v1, an in-memory store wrapped in `Arc<Mutex<Vec<Email>>>` is sufficient. Emails do not need to survive restarts in the first version, and retention can be enforced by capping the list length.

For v1.1 or v2, switch to SQLite via `rusqlite` or `sqlx`. Tauri has a plugin for SQL but using the crate directly gives more control. Schema: one table for emails (id, received_at, from, to, subject, raw, parsed_json), one table for attachments referenced by email id.

The data lives in the OS-appropriate application support directory: `~/Library/Application Support/[Product]` on macOS, `%AppData%\[Product]` on Windows, `~/.local/share/[product]` on Linux. Tauri's `path` API resolves these.

### 12.4 Frontend-backend communication

Two channels matter.

**Commands** (frontend → backend): the frontend calls `invoke("list_emails")`, `invoke("get_email", { id })`, `invoke("clear_inbox")`, etc. These are Tauri's RPC mechanism, type-safe with serde.

**Events** (backend → frontend): when the SMTP server captures a new email, the backend emits `app.emit("new-email", email)`. The frontend listens and updates the inbox live. No polling.

### 12.5 Security model

The SMTP listener binds to `127.0.0.1` by default, never `0.0.0.0`, to prevent accidental exposure on shared networks. The settings panel can offer LAN binding for users who explicitly want it, with a warning.

The HTTP API in v1.1 also binds to 127.0.0.1 only by default.

HTML email rendering uses a sandboxed iframe with `allow-same-origin` only — no scripts, no forms, no top-level navigation. Captured email can contain anything, and the renderer must assume it is hostile.

Attachments are written to a temporary directory only when the user explicitly downloads them, never automatically.

No telemetry, no analytics, no crash reporting by default. If crash reporting is added later, it must be opt-in and clearly disclosed.

### 12.6 Process lifecycle

The SMTP server starts when the Tauri app starts and stops when it exits. There is no separate daemon, no background service, no install-as-a-service mode in v1. The simplification matches the user's mental model: the app is running, mail is being captured; the app is closed, mail is not.

The app launches at login if the user enables that setting. On macOS this uses `launchctl` via Tauri's autostart plugin. On Windows it uses the Run registry key. On Linux it writes a `.desktop` file to `~/.config/autostart`.

Closing the main window does not quit the app. The window hides and the tray icon remains. Quit is explicit, either from the tray menu or from the keyboard shortcut.

---

## 13. Platform Strategy

The product must feel equally native on all three platforms. This is non-negotiable.

### 13.1 macOS

Signed and notarized .dmg distribution. Universal binary for Intel and Apple Silicon. Native menu bar integration. The tray icon uses a template image so it adapts to light and dark menu bars automatically. Window controls follow macOS conventions (traffic lights, no custom close button). Distributed via direct download and via Homebrew as a cask.

### 13.2 Windows

MSI installer, signed with an EV or OV code signing certificate (the project will need to acquire one — this is a real cost of doing business on Windows). System tray icon. Window controls follow Windows conventions. Distributed via direct download, via Scoop, and ideally via WinGet.

### 13.3 Linux

Multiple distribution channels: AppImage for universal portability, .deb for Debian and Ubuntu, .rpm for Fedora, an AUR package for Arch. Flatpak as a stretch goal. System tray support is uneven across Linux desktop environments — the app must degrade gracefully when the tray is unavailable, with a settings option to disable tray-only mode.

---

## 14. Distribution and Packaging

The release pipeline matters as much as the product. A polished tool that only ships as a .tar.gz on a GitHub releases page will not be adopted at scale.

The product needs a real landing page. A custom domain. A signed installer for every platform. Package manager presence on day one (Homebrew, Scoop, AUR). A short demo video, ideally a GIF embedded in the README that shows the core loop in under twenty seconds.

GitHub Actions handles the build matrix: macOS (Intel and Apple Silicon), Windows x64, Linux x64. Tauri's action handles cross-platform building. Releases are tagged with semver, GitHub Releases hosts the artifacts, and a small update server (or Tauri's built-in updater) handles in-app updates.

Documentation lives in the repo under `docs/` and is published as a small static site. Mintlify, Astro Starlight, or VitePress are all good choices. The documentation needs to cover installation per platform, configuration per framework (the framework cards from v1.1 should have a documentation home), the HTTP API reference, and a brief FAQ.

---

## 15. Open Source Strategy

The project is open source from day one. License is MIT or Apache 2.0; MIT is simpler and more permissive, Apache 2.0 includes explicit patent grants. Recommendation: MIT for ease of contribution.

The repository structure is conventional: `src-tauri/` for the Rust backend, `src/` for the frontend, `docs/` for the documentation site, `.github/` for issue templates, PR templates, and workflows. A `CONTRIBUTING.md`, a `CODE_OF_CONDUCT.md`, and a clear `README.md` are mandatory.

The README itself is a portfolio artifact. It needs a hero image or GIF, a one-paragraph pitch, installation commands for each platform, a comparison table against Mailpit and competitors, a screenshot grid, a feature list, and a clear contribution invitation. The README is often the first impression for both users and recruiters.

Issue templates separate bug reports, feature requests, and design feedback. A pinned discussion thread invites users to share their workflow setups. The roadmap lives in a public GitHub Project board.

Conventional commits and semantic versioning are used from the first commit. A changelog is generated automatically via release-please or a similar tool.

---

## 16. Roadmap and Milestones

A realistic timeline for a solo developer working on this in evenings and weekends, assuming roughly ten to fifteen hours per week.

**Weeks 1–2.** Tauri scaffold, SMTP listener running, raw email capture, basic in-memory storage, IPC commands working.

**Weeks 3–4.** Inbox list UI, email detail view with four tabs, basic styling system, light/dark theme.

**Weeks 5–6.** Tray icon, server status controls, settings panel, keyboard navigation, search.

**Week 7.** Visual polish pass, empty states, framework setup cards (basic version), test-email feature, sandboxed HTML rendering.

**Week 8.** Cross-platform build pipeline, signing setup, packaging for each platform. This week always takes longer than expected.

**Week 9.** Documentation site, landing page, README, screenshots, demo video.

**Week 10.** Private beta with a small group of developer friends. Bug fixes. Polish.

**Week 11.** Version 1.0 public launch. Hacker News, Reddit (r/programming, r/webdev, language-specific subs), Twitter, dev.to writeup.

**Weeks 12–16.** Multiple mailboxes, HTTP API, CLI, viewport preview, expanded framework cards. Version 1.1.

This timeline is aggressive but achievable. The single biggest risk is the platform packaging week, particularly Windows code signing and macOS notarization, which can each consume days on their own.

---

## 17. Launch Plan

The launch is a coordinated moment, not an upload.

The day-of artifacts: a polished landing page at the project's domain, a tagged v1.0 release with signed binaries for all platforms, package manager submissions (Homebrew cask PR opened, Scoop manifest published, AUR package uploaded), a README with the demo GIF, a written launch post on the project blog or on the developer's personal site.

The launch channels: Hacker News (Show HN), Reddit (r/programming, r/webdev, r/rust because of the Tauri/Rust angle, language-specific subs for Node, Python, PHP, Ruby), Twitter or BlueSky with a short demo video, dev.to and Hashnode with a longer-form post, the Tauri Discord, the Rust subreddit weekly thread.

The launch narrative: not "I built another Mailpit." The narrative is "I was tired of leaving Mailpit running in a browser tab and I wanted something that felt like Linear, so I built it." A personal, specific origin story performs better than a feature announcement.

A follow-up content piece a week or two after launch: "How I built [Product] with Tauri, Rust, and SolidJS." This piece is the portfolio artifact that recruiters and engineers will read, and it should be substantive — architecture decisions, tradeoffs, things that went wrong, screenshots from the design process.

---

## 18. Success Metrics

Three numbers matter for the first six months.

**GitHub stars.** A proxy for awareness and developer interest. A successful launch puts the project at 1,000+ stars within a month. A strong project compounds from there.

**Daily active installs.** Harder to measure without telemetry, which the product does not collect. Approximated through package manager download counts (Homebrew analytics, Scoop manifest downloads), GitHub release download counts, and the rate at which issues are opened.

**Contributor count.** A healthy open-source project attracts contributors. The metric is the number of people other than the original developer who have merged a PR within six months. A target of ten is realistic and meaningful.

Secondary signals: appearances in newsletter roundups (Console, TLDR, Pointer), mentions in podcast tool segments, integrations built by third parties (a Cypress plugin, a Playwright fixture, a Jest matcher), and word-of-mouth recommendations in developer communities.

---

## 19. Risks and Open Questions

**Differentiation risk.** Mailpit is good, free, actively maintained, and has momentum. The product needs to be visibly, obviously better at the things developers feel, not just technically equivalent. The design bar must be high enough that screenshots alone make the case.

**Maintenance burden.** Open-source projects with traction generate ongoing issue load. A solo maintainer can burn out. The mitigation is to ship a tight v1 with a small surface area, accept fewer feature contributions until v2, and document the scope clearly.

**Platform packaging.** Code signing on Windows costs money (a few hundred dollars per year for a certificate). macOS notarization requires an Apple Developer account ($99/year). These are real costs. They are also non-negotiable — unsigned binaries will be flagged as malware by every modern OS.

**Naming and domain.** The name must be available as a domain, as a GitHub organization, on Homebrew, on Scoop, and on common package registries. Verification of all of these before committing to a name.

**The HTML rendering security boundary.** Captured emails are untrusted input. The sandboxing must be done carefully. A single iframe escape or a single allowed origin leak undermines the local-by-default promise.

**Open questions to resolve before development starts:**

What is the final name? What frontend framework — SolidJS, Svelte, or React? Will v1 include the HTTP API or is that strictly v1.1? Is the brand color decided? Who designs the logo and tray icon? Is there a budget for code signing certificates and an Apple Developer account?

---

## 20. Appendix — Inspiration and References

Visual and interaction reference points worth studying closely while building:

Linear's typography, density, and sidebar treatment. Raycast's command palette, keyboard model, and tray-first philosophy. TablePlus's native feel and refusal to be a browser app pretending to be desktop. Arc Browser's color usage and sidebar collapse behavior. Things 3 for the empty-state design language.

Technical reference points:

Mailpit's HTTP API design (worth matching closely for compatibility). The Tauri documentation and examples repository. The `mail-parser` crate documentation for the parsing edge cases. SMTP RFC 5321 for the protocol details, and RFC 5322 for message format. The Mintlify or Starlight documentation site templates.

---

*End of document. Next step: pick a name, settle on the frontend framework, and start the Tauri scaffold.*
