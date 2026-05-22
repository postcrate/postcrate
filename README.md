<h1 align="center">postcrate</h1>

<p align="center">
  A native SMTP inbox for the email your apps send while you build.
</p>

<p align="center">
  <a href="https://github.com/postcrate/postcrate/releases"><img alt="version" src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <img alt="macOS" src="https://img.shields.io/badge/macOS-supported-success?style=flat-square">
  <img alt="windows" src="https://img.shields.io/badge/Windows-planned-lightgrey?style=flat-square">
  <img alt="linux" src="https://img.shields.io/badge/Linux-planned-lightgrey?style=flat-square">
</p>

---

> **TL;DR**
> Postcrate runs a real SMTP server on your machine, captures the mail your apps send during development, and shows you whether it would land in production. Spam scoring, DKIM, link audits, and client-by-client previews. Local-first. No SaaS.

## Quick start

```bash
# Build from source (binary releases coming next)
git clone git@github.com:postcrate/postcrate.git
git clone git@github.com:postcrate/postcrate-core.git
cd postcrate && pnpm install && pnpm tauri dev
```

```bash
# Send mail to the default mailbox
swaks --to test@local --server 127.0.0.1:1025 \
      --header "Subject: Hello postcrate" \
      --body "Captured."
```

## Features

| Area | What's included |
|------|-----------------|
| **SMTP** | EHLO advertisement, STARTTLS, AUTH PLAIN/LOGIN, SMTPUTF8 (RFC 6531), 8BITMIME (RFC 1652), PIPELINING |
| **Mailboxes** | Persistent or ephemeral with TTL. Auto-suggested free ports. Per-mailbox stats |
| **Inspection** | Spam score with rule breakdown, link audit, SPF/DKIM/DMARC verification, list-unsubscribe validation |
| **Rendering** | Client previews for Gmail Web/iOS, Outlook Desktop/Web, Apple Mail Mac/iOS, Yahoo. HTML lint + a11y audit |
| **Scenarios** | Chaos mode (delays, drops, transient rejects). Bounce rules with custom SMTP reply codes |
| **Integrations** | Forwarding rules to upstream SMTP. Webhooks with optional bearer auth |
| **Recording** | Export any mailbox to JSON. Replay through the full ingest pipeline |
| **Observability** | Append-only audit log. Per-message SMTP session transcripts |
| **UX** | Command palette (`⌘K`), system notifications, dock badge, global shortcut, launch at login |

## Why postcrate?

|                          | Postcrate | MailHog | Mailtrap | Mailpit |
|--------------------------|:---------:|:-------:|:--------:|:-------:|
| Native desktop app       | ✓         |         |          |         |
| Offline / local-first    | ✓         | ✓       |          | ✓       |
| Client render previews   | ✓         |         | ✓        |         |
| SPF/DKIM/DMARC verdicts  | ✓         |         | ✓        |         |
| Fault injection (chaos)  | ✓         |         |          |         |
| Recording & replay       | ✓         |         |          |         |
| Per-session SMTP transcript | ✓      |         |          | ✓       |
| Forwarding to real SMTP  | ✓         |         |          | ✓       |
| Webhooks                 | ✓         | ✓       |          | ✓       |

## How it works

```
┌──────────────────┐         ┌─────────────────────┐
│  React 19 + TS   │ ◄────►  │    postcrate-core   │
│   (Tauri shell)  │  IPC*   │     (Rust crate)    │
└──────────────────┘         └──────────┬──────────┘
                                        │
                  ┌─────────────────────┼─────────────────────┐
                  │                     │                     │
            SMTP listeners       Local HTTP API         SQLite + flat files
            (one per mailbox)    (MCP, scripts)         (mail, audit, blobs)

* Typed end-to-end via tauri-specta. No raw fetch() from the renderer.
```

- **Engine:** [`postcrate/postcrate-core`](https://github.com/postcrate/postcrate-core). Rust. No UI dependencies. Embeddable into a CLI or service.
- **Shell:** this repo. Tauri 2, React 19, TypeScript. SWR for engine-derived data, zustand for UI state, engine events drive live cache mutations.
- **Storage:** `~/Library/Application Support/dev.postcrate.app/` on macOS. SQLite + flat blobs. Portable. Removable.

## Inspection

Every captured message runs through four local analyses:

- **Spam.** Calibrated score plus the rules that fired. Modeled on the most-cited SpamAssassin heuristics.
- **Auth.** SPF, DKIM, and DMARC verdicts computed from headers on the captured message. No live DNS.
- **Links.** Enumerates every URL, classifies insecure/mailto/tracking, flags shorteners and mismatched display text.
- **Unsubscribe.** Validates `List-Unsubscribe` and `List-Unsubscribe-Post` against the modern Gmail/Yahoo bulk-sender requirements.

## Rendering

Compiles HTML against client profiles, each annotated with a fidelity rating (`high`, `approximate`, `experimental`):

- Gmail Web · Gmail iOS
- Outlook Desktop · Outlook Web
- Apple Mail Mac · Apple Mail iOS
- Yahoo Mail

Lint and accessibility audits run beneath the preview, calling out the properties each profile silently rewrites or drops.

## Scenarios

- **Chaos mode.** Injects randomized faults (delays, transient `421`s, mid-DATA drops) into a target mailbox. The inbox shows a banner while chaos is active so behavior is never ambiguous.
- **Bounce rules.** Match recipient regex / header / body. Respond with any SMTP reply code. Compose with chaos to exercise retry logic.

## Privacy

- No network egress unless you configure a forwarding rule, webhook, or accept an updater check.
- All inspection runs on captured bytes. No DNS, no RBL, no telemetry.
- No analytics SDK. No crash reporting service.
- All state lives in your application support directory and is portable.

## Development

Requires Rust (stable), Node 20+, pnpm 9+, plus your platform's Tauri [prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
# Sibling repos in a shared parent directory
mkdir postcrate && cd postcrate
git clone git@github.com:postcrate/postcrate.git
git clone git@github.com:postcrate/postcrate-core.git

cd postcrate
pnpm install
pnpm tauri dev          # full app, hot-reloaded
```

| Script              | Purpose                                        |
|---------------------|------------------------------------------------|
| `pnpm dev`          | Vite-only. UI iteration without the shell.    |
| `pnpm tauri dev`    | Full desktop app, hot-reloaded.               |
| `pnpm tauri build`  | Production bundle.                            |
| `pnpm tsc --noEmit` | Type check.                                   |
| `pnpm lint --fix`   | Lint with autofix.                            |

When you change a Tauri command on the engine side, regenerate the typed bindings:

```bash
cd src-tauri && cargo test --features generate-bindings
```

## Roadmap

| Item                                                | State              |
|-----------------------------------------------------|--------------------|
| Signed macOS `.dmg` with auto-update                | In progress        |
| Homebrew Cask                                       | After macOS GA     |
| Windows MSI, Linux AppImage                         | Planned            |
| MCP server for local AI agents                      | Engine work next   |
| Hits column on bounce rules                         | Engine work next   |
| Live SMTP session log sidebar                       | Engine work next   |

## License

[MIT](LICENSE).
