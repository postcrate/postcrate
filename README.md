<h1 align="center">postcrate</h1>

<p align="center">
  A local inbox for the email your apps send while you build.
</p>

<p align="center">
  <a href="https://github.com/postcrate/postcrate/releases"><img alt="version" src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square"></a>
  <a href="#license"><img alt="license" src="https://img.shields.io/badge/license-TBD-lightgrey?style=flat-square"></a>
  <img alt="macOS" src="https://img.shields.io/badge/macOS-supported-success?style=flat-square">
  <img alt="windows" src="https://img.shields.io/badge/Windows-planned-lightgrey?style=flat-square">
  <img alt="linux" src="https://img.shields.io/badge/Linux-planned-lightgrey?style=flat-square">
</p>

---

Postcrate is a desktop SMTP capture tool. It runs a local mail server on a port you pick, catches every message your app sends, and shows them in an inbox built for the way developers actually debug email: headers, raw source, link checks, auth verdicts, and side-by-side previews of how the same message renders in Gmail, Outlook, and Apple Mail.

It exists because the alternatives are either web services you have to trust with your dev mail, or command-line tools that drop you in front of a `tail -f`. Neither is the right shape for the work.

Everything runs offline. No accounts, no telemetry, no outbound calls.

## Highlights

- **Multiple mailboxes.** Persistent or ephemeral with a TTL. Each binds its own port. Port suggestion finds you a free one.
- **Real SMTP server.** EHLO, STARTTLS, AUTH (PLAIN / LOGIN), SMTPUTF8, 8BITMIME, PIPELINING. Captures the full envelope plus a per-message session transcript.
- **Inspect tab.** Spam score with rule breakdown, link audit (insecure, mailto, tracking), SPF / DKIM / DMARC verdicts, and list-unsubscribe validation. All local heuristics. No DNS or RBL lookups.
- **Render tab.** Renders the same HTML against client profiles (Gmail Web, Gmail iOS, Outlook Desktop, Outlook Web, Apple Mail Mac, Apple Mail iOS, Yahoo) with HTML lint and accessibility findings.
- **Scenarios.** Chaos mode fault-injects delays, drops, and rejections. Bounce rules let you make the server reject mail that matches patterns you define.
- **Recording and replay.** Export a mailbox to a JSON file. Replay it into any mailbox to reproduce a bug deterministically.
- **Forwarding rules.** Relay matched mail upstream to a real SMTP server when you want staged delivery or pre-prod review.
- **Webhooks.** POST every captured email to a URL of your choice. Slack, a CI hook, a dev relay.
- **Audit log.** Every meaningful engine action, in order. Filterable. Append-only.
- **Notifications.** In-app toast, system notification, sound, and a dock badge. Per-mailbox suppression when you're already looking at the inbox.
- **Command palette.** `⌘K` from anywhere. Jump to any mailbox, run any action.
- **Linear-grade UI.** Light, dark, and system themes. A global shortcut you can rebind. Launch at login. Hide the dock icon to run in the background.

## Install

Binary releases are not published yet. For now, build from source (see [Development](#development)).

When releases ship, you'll get:

- **macOS:** `.dmg` from [GitHub Releases](https://github.com/postcrate/postcrate/releases) and `brew install --cask postcrate` via Homebrew.
- **Windows:** signed `.msi`.
- **Linux:** `.deb`, `.AppImage`, and an AUR package.

Auto-update is wired through Tauri's signed updater plugin. New versions are detected and applied without leaving the app.

## Quick start

```bash
# 1. Create a mailbox in the app, say on port 1025.

# 2. Send mail to it from your code.
swaks --to test@local --server 127.0.0.1:1025 \
      --header "Subject: Hello postcrate" \
      --body "First capture."

# 3. Watch the row land in the inbox. Click it to see the full message,
#    headers, parsed links, auth verdicts, and the client-by-client render.
```

That's it. No configuration. No accounts.

## How it works

```
┌────────────────────────────────────────────────────────┐
│ Postcrate desktop app                                   │
│                                                         │
│  ┌────────────────┐         ┌─────────────────────┐    │
│  │ React 19 + TS  │ ◄────►  │   postcrate-core    │    │
│  │  (UI)          │  Tauri  │   (Rust engine)     │    │
│  └────────────────┘  IPC    └──────────┬──────────┘    │
│                                         │                │
└─────────────────────────────────────────┼───────────────┘
                                          │
                  ┌───────────────────────┼──────────────────────┐
                  │                       │                      │
              SMTP listeners        Local HTTP API         SQLite store
              (one per mailbox)     (for MCP + scripts)    (mail + audit)
```

The core is a Rust crate (`postcrate-core`) that owns every byte your app sends. It accepts SMTP connections, parses the envelope, runs your bounce and chaos rules, hands the message to the inbox pipeline, and emits typed events. The React shell subscribes to those events and renders them.

Cross-process traffic uses Tauri IPC with [tauri-specta](https://github.com/oscartbeaumont/tauri-specta) so every command and event is fully typed end to end. There is no `fetch()` against an HTTP API from the renderer.

Data lives in a single SQLite database under `~/Library/Application Support/dev.postcrate.app/` on macOS. Attachments and raw `.eml` blobs sit beside it as files. You can `rm -rf` the directory at any time to start fresh.

## Inspect & render

The inspect tab grades a message the way an engineer would: a calibrated spam score with the exact rules that fired, a link audit that flags insecure or tracking URLs, an authentication panel that runs SPF / DKIM / DMARC verifications against the message headers themselves, and a list-unsubscribe validator that checks both header forms (mailto + URL) and the one-click variant.

The render tab takes the message HTML through a layered transform that approximates how each major client treats CSS, image loading, and dark-mode preferences. Each profile is tagged with a fidelity rating so you know when a rendering is best-effort versus production-accurate. Below the iframe, lint and accessibility findings call out issues a real inbox would punish.

## Scenarios

When everything works in dev, that's not when bugs happen. Scenarios let you reproduce the conditions where they do.

- **Chaos mode** injects random delays, transient rejections, and connection drops on a per-mailbox basis. Toggle it from the Scenarios screen.
- **Bounce rules** make the SMTP server reject mail that matches patterns you write (recipient regex, header match, body match), with the SMTP reply code of your choice. Useful for testing how your retry logic behaves against `550`, `421`, or anything else.

## Recording & replay

Right-click any mailbox to export its messages to a single JSON file. Right-click another mailbox to replay that file into it. The captured envelopes are re-injected through the same ingest pipeline, so every downstream side effect (forwarding, webhooks, audit entries) fires as if the mail arrived fresh.

Useful for handing a reproduction to a colleague, replaying production-shaped data through a new bounce rule, or smoke-testing the inbox itself.

## Forwarding & webhooks

**Forwarding rules** let you relay matched mail upstream to a real SMTP server. Scope rules globally or per-mailbox. Disable a rule without deleting it.

**Webhooks** POST every captured email to a URL of your choice. Authorization headers are supported. Failed deliveries show up in the [notifications](#notifications) bell and in the audit log.

## Configuration

Postcrate has no config file. Everything lives in the Preferences window (`⌘,`):

- **General** — launch at login, dock visibility, global shortcut.
- **Appearance** — light, dark, or system theme.
- **Notifications** — in-app toast, sound, system notification, dock badge.
- **Inbox** — default message detail tab, preview font, message density.
- **Network** — the local HTTP API port and bearer token (used by MCP and scripts).
- **Privacy** — toggle the heuristics that run on every captured message.
- **Advanced** — debug logging, SMTP transcript preservation, log retention.

Projects group mailboxes so you can keep work for different apps separate. Switch projects from the sidebar.

## Privacy

Postcrate is local-first by design.

- No network egress unless you configure forwarding rules or webhooks.
- No telemetry. No crash reports. No update pings outside the standard Tauri updater check.
- All inspection heuristics run on-device. SPF / DKIM / DMARC verification reads the captured headers; it does not perform live DNS lookups.
- All data is in SQLite and flat files under your application support directory. You own it. You can wipe it.

## Architecture

Postcrate is split into two sibling repositories:

| Repo | Role |
|------|------|
| [`postcrate/postcrate`](https://github.com/postcrate/postcrate) | Tauri 2 + React 19 + TypeScript desktop shell. Owns the UI, IPC bindings, OS integration, and notification logic. |
| [`postcrate/postcrate-core`](https://github.com/postcrate/postcrate-core) | Rust crate. Owns the SMTP server, ingest pipeline, storage, audit log, scenarios, forwarding, webhooks, and analysis engines. |

The split exists for a reason. The engine has no UI dependencies and could be embedded into a CLI, a CI binary, or a managed service without touching this repo.

Inside the shell:

```
src/
├── components/       # Shared UI: sidebar, top bar, command palette, primitives
├── data/             # Static nav metadata
├── hooks/            # App-level hooks (theme, etc.)
├── lib/              # IPC bridge, fetcher, utilities
├── pages/            # Routed screens (inbox, mailboxes, scenarios, webhooks, audit, preferences, onboarding)
├── services/         # SWR hooks + IPC actions + engine event subscriptions, one file per feature
├── stores/           # Zustand stores (UI state, projects, view, preferences)
└── styles/           # Tailwind entry
```

State management splits cleanly: SWR for engine-derived data, zustand for UI-only state, engine events feed into SWR cache mutations so the UI stays live without polling.

## Development

You'll need:

- [Rust](https://rustup.rs) (latest stable)
- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+
- macOS Xcode Command Line Tools, or the Linux / Windows equivalents Tauri lists in its [prereqs](https://v2.tauri.app/start/prerequisites/)

You'll also want the engine repo checked out as a sibling directory:

```bash
mkdir postcrate && cd postcrate
git clone git@github.com:postcrate/postcrate.git
git clone git@github.com:postcrate/postcrate-core.git
cd postcrate
pnpm install
pnpm tauri dev
```

The first build takes a few minutes while Cargo compiles the engine. Subsequent dev runs are incremental and fast.

**Useful scripts:**

```bash
pnpm dev               # Vite-only, for UI-only iteration (no Tauri shell)
pnpm tauri dev         # Full desktop app, hot-reloaded
pnpm tauri build       # Signed release bundle
pnpm tsc --noEmit      # Type check
pnpm lint              # ESLint
pnpm lint --fix        # Autofix
```

**Updating the typed IPC bindings:**

After changing a Tauri command on the engine or shell side, regenerate the TypeScript bindings:

```bash
cd src-tauri
cargo test --features generate-bindings
```

This writes `src/lib/bridge/bindings.ts` with the new command and event types.

## Roadmap

Honest. In rough priority order:

- **Binary releases.** Signed + notarized macOS `.dmg`, Windows `.msi`, Linux `.AppImage` via GitHub Releases. Auto-update wired through the Tauri updater plugin.
- **Homebrew Cask.** `brew install --cask postcrate`.
- **MCP server.** Expose the inbox to local AI agents as Model Context Protocol tools. The settings panel is already there; the server side is next.
- **Hits column on bounce rules.** A counter for how often each rule has matched.
- **Live SMTP log sidebar.** A timeline of per-connection events while a mailbox is receiving.
- **Cross-platform polish.** Windows and Linux are buildable today but the UI affordances assume macOS conventions. Bringing them to parity is its own pass.

## License

License is TBD. Until it's set, treat the source as available for read but not yet licensed for redistribution.

A choice is coming soon. Likely MIT or AGPLv3.

---

<p align="center">
  Made for engineers who don't like trusting their dev mail to someone else.
</p>
