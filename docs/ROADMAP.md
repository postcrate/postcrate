# Postcrate — Roadmap

_Working draft. Companion to `PROD.md` (vision/v1) and `REQ.md` (advanced feature requirements). Updated after Phase 1 engine completion._

## Status snapshot

**Done — Phase 1 (engine).** The mail engine lives as a standalone Cargo workspace at `../postcrate-core/` (sibling to this repo, no Tauri dependency). Three crates:

| Crate | Purpose |
|---|---|
| `postcrate-core` | Library. `Service` façade exposing every operation. |
| `postcrate-server` | Mailpit-style headless daemon (`postcrate run …`). |
| `postcrate-ci` | Fast-start CI variant; prints connection info on ready. |

The engine ships: multi-mailbox SMTP listener (EHLO/HELO + PIPELINING/SIZE/8BITMIME/SMTPUTF8/ENHANCEDSTATUSCODES/HELP/VRFY), streaming DATA reader with dot-stuffing + spill-to-disk, `mail-parser` for RFC 5322, SQLite via `sqlx` with FTS5, multi-mailbox lifecycle (primary/shared/ephemeral with TTL scheduler), chaos injection (deterministic with seed), bounce rules (live-updatable glob match at RCPT TO), retention/auto-clear, audit logging, Axum HTTP API on `/api/v1`, `EventSink` trait for UI-agnostic event fan-out.

End-to-end verified against the headless daemon: real captures from Python `smtplib`, multipart with attachments, ephemeral mailbox port allocation, deterministic chaos rejection, live bounce rules, message detail + attachment download.

This document covers everything else, **ordered by where the work happens**: engine first (no UI involvement), then the Tauri integration shell, then frontend, then ecosystem.

---

# A. Engine work

All in the `postcrate-core/` repo. No frontend or Tauri code involved. These can ship without the desktop app existing.

## A1. Engine hardening — finish the Mailpit-grade gates

The plan from Phase 1 committed to these gates but I deferred them when scope ran long. They're <2 days of work and they're what separates "smoke test passed" from "Mailpit-grade."

- **RFC 5321 conformance corpus** — `tests/rfc5321/*.txt`. Each fixture is a transcript + the expected reply code per line. Cover: HELO/EHLO greetings, MAIL FROM with all extension params, RCPT TO with multiple, DATA happy path, RSET mid-transaction, line-too-long, bad sequence, size exceeded, null sender `<>`, quoted-local-part addresses.
- **MIME fixtures** — `tests/mime_fixtures/*.eml`. Real `.eml` files including multipart/alternative, multipart/related with `cid:` inline images, RFC 2047 encoded-word subjects, UTF-8 subjects (SMTPUTF8), `Content-Disposition: attachment; filename*=UTF-8''…` encoding. Each must round-trip byte-identical raw and produce the expected `EmailDetail` shape.
- **Stress test** — `tests/stress.rs`. Send 10k messages concurrently from many client sockets. Asserts zero loss, FTS index integrity, retention triggers without race. Tracks p99 capture latency (target <200ms per `NFR-PERF-01`).
- **Fuzz targets** — `fuzz/fuzz_targets/{smtp_command,mail_parse}.rs`. `cargo fuzz run smtp_command --max_total_time=300` in CI. No panics, no OOMs.
- **Interop scripts** — `tests/clients/{node_nodemailer.js, python_smtplib.py, go_net_smtp.go, swaks.sh}`. A single `tests/clients/run-all.sh` boots `postcrate-ci`, runs all four, asserts all four captures land.
- **FTS-backed search** — the current `search_emails` uses LIKE as a fallback; wire the FTS5 query path properly so the index is queried, not just populated.
- **STARTTLS enablement** — `tokio-rustls` + `rustls-pemfile` behind the existing `tls` feature flag. Implement `upgrade_to_tls(stream, cert, key)` in `smtp/tls.rs`. Flip `EhloAdvert.starttls_enabled = true` when the feature is on. Add the STARTTLS handler in `session.rs` (it calls `upgrade_to_tls` before the next EHLO round; the rest of the loop is already generic over `Io`).
- **`/api/v1/audit` route** — `Service::list_audit` / `clear_audit` already exist; expose them as HTTP endpoints so the future Tauri shell and the eventual CLI both can read the audit log.

**Exit gate:** `cargo test --workspace` green, `cargo clippy --workspace --all-targets -- -D warnings` clean, the conformance + fuzz + interop scripts all pass in CI.

## A2. MCP server — new `postcrate-mcp` crate

`REQ.md §3.1`, P0. This is the highest-leverage piece in the entire product — "first SMTP testing tool built for agents" is unowned in the market.

A new binary + thin library crate in the workspace. Consumes `Service`. Implements the MCP wire protocol (stdio + optionally a TCP/HTTP transport once the spec stabilizes).

Tools to expose:

- `list_emails(mailbox, since?, sender?, recipient?, subject?, limit?)` — paginated metadata.
- `get_email(id)` — full content with parsed headers, text body, html body, attachment metadata (blob bytes by separate fetch).
- **`wait_for_email(predicate, timeout)`** — the agent-defining one. Blocking call up to `timeout` (default 30s, max 300s) that returns the first email matching the predicate, or a structured timeout response *including* the list of emails that did arrive but didn't match (so the agent can diagnose "code didn't try" vs "code addressed it wrong"). Implementation plumbs `ChannelSink` from the engine; the MCP task subscribes to the broadcast and filters in-task.
- `assert_email_matches(id, expected)` — structured diff. Supports subject (string or regex), recipients, sender, headers, body substring, body regex, attachment presence. Returns granular failure info, not just a boolean.
- `clear_inbox(mailbox_id, confirm: true)` — requires explicit `confirm`. Audit-logged.

Day-one docs include copy-pasteable MCP config snippets for **Claude Code** and **Cursor** in `docs/MCP.md`.

## A3. Headless CLI tooling

`PROD.md §9.2` + `REQ.md §3.2`. Extend `postcrate-server`'s clap subcommands. These are what make the engine scriptable without a UI:

- `postcrate latest [--mailbox] [--json]` — most recent email, formatted or JSON.
- `postcrate count [--mailbox] [--json]` — total emails.
- `postcrate clear [--mailbox] [--confirm]` — clear-inbox from the shell.
- **`postcrate wait`** — same predicate API as the MCP `wait_for_email`. Flags: `--subject` / `--from` / `--to` / `--header` / `--timeout` / `--mailbox` / `--json`. Distinct exit codes for "no email at all" (1) vs "emails arrived but none matched" (2) so shell scripts can branch.
- **`postcrate tail [--grep pattern] [--json]`** — live streams from `ChannelSink` to stdout as messages arrive. Exits cleanly on SIGINT.
- `--json` everywhere with a documented stable schema (`docs/CLI_JSON.md`).

## A4. Test matcher packages — separate repos per language

`REQ.md §4.1` (FR-TEST-01, P0). The "tests fail without it" lock-in mechanism. **One repo per language**, since each ships to its native registry:

| Repo | Package | Registry |
|---|---|---|
| `postcrate/postcrate-jest` | `@postcrate/jest` + `@postcrate/vitest` | npm |
| `postcrate/postcrate-pytest` | `postcrate-pytest` | PyPI |
| `postcrate/postcrate-rspec` | `postcrate-rspec` + `postcrate-minitest` | RubyGems |
| `postcrate/postcrate-go` | module path under `pkg.go.dev` | Go modules |
| `postcrate/postcrate-phpunit` | `postcrate/postcrate-phpunit` | Packagist |

Each consumes the HTTP API. Common surface:

- `createMailbox()` / fixture helper that runs at test setup, returns the ephemeral host+port, cleans up at teardown.
- `expect(inbox).toContainEmail({ to, subject })` (and equivalents per framework's idiom).
- `waitForEmail(predicate, timeoutMs)` async helper backed by the same MCP `wait_for_email` semantics.
- `count_matches`, `last_email`, `no_emails_match`.

Each ships with a quickstart README and a link to the Postcrate docs site. Versions track the HTTP API version they target.

## A5. CI distribution

`REQ.md §4.3`:

- **Docker image** — `ghcr.io/postcrate/postcrate-ci:<version>` built from `postcrate-ci`. Multi-arch (amd64, arm64). Cold start <2s.
- **GitHub Action** — `postcrate/setup-action`. One-liner in a workflow file:
  ```yaml
  - uses: postcrate/setup-action@v1
  ```
  Installs the binary, starts it, exports `POSTCRATE_SMTP_HOST` / `POSTCRATE_SMTP_PORT` / `POSTCRATE_API_URL` to subsequent steps. Submit to the GitHub Marketplace.
- A second smaller action `postcrate/wait-action` that wraps `postcrate wait` for declarative test-flow assertions.

## A6. Rendering preview engine

`REQ.md §5` (FR-RENDER, P1). The SaaS-displacing bet vs. Litmus/Email on Acid. **The rendering engine lives in `postcrate-core`** (so HTTP API + matcher packages + Tauri UI all benefit), not in the Tauri shell.

- **Client profile transforms** — `core::rendering::profile::{Profile, apply(html, profile) -> html}`. Day-one profiles: Gmail Web, Gmail iOS, Outlook Desktop (Windows), Outlook Web, Apple Mail (macOS), Apple Mail (iOS), Yahoo Mail. Each is a CSS-quirk transform that strips/rewrites unsupported features (Outlook strips `<style>` in `<body>`, Gmail strips CSS grid, etc.).
- **Fidelity badges** — each profile reports `high | approximate | experimental` so we never claim what we can't deliver (FR-RENDER-02).
- **HTML linter** — `core::rendering::lint`. Day-one warnings: `<style>` inside `<body>`, CSS Grid usage, unsupported pseudo-classes per client, web fonts not supported in Outlook, missing fallback fonts.
- **Dark-mode toggle** — `prefers-color-scheme: dark` applied + optional per-client dark-mode behavior layered on top.
- **A11y linter** — contrast ratios, alt-text presence, heading semantics, "click here" detection.
- **QR mobile preview** — single-use signed local URL, expires in 10 min, opt-in per session (FR-RENDER-20).

All output exposed via new HTTP routes (`/api/v1/messages/:id/render?profile=…` etc.) so the matcher packages can assert on rendered output too, not just raw content.

## A7. Scenario testing — beyond chaos + bounces

`REQ.md §6`:

- **Spam scoring** — `core::scenarios::spam_score`. Local SpamAssassin-equivalent heuristics (no remote call). Returns score + contributing factors in plain English ("Missing List-Unsubscribe header (+1.2)", "High image-to-text ratio (+0.8)"). Runs async after insert; doesn't block the ingest path.
- **Link checker** — opt-in per mailbox setting. Background task that HEAD-checks links in HTML and text bodies. Flags broken (4xx/5xx), insecure (`http://`), and missing tracking params (configurable regex).
- **SPF/DKIM/DMARC alignment** — header inspection only, no remote DNS calls in v1. Reports "would pass / would fail at a typical major receiver" per protocol. Honest about being a prediction (FR-SCENARIO-30).

## A8. Recordings (fixture format)

`REQ.md §4.4` (FR-TEST-30..32). A `.postcrate` file format that records a sequence of captured emails (raw SMTP transcripts + parsed metadata) for replay. Engine-side work: serializer + replay-into-mailbox tool. Matcher packages then load `.postcrate` files as test fixtures so a test run produces the same result on every machine.

---

# B. Tauri integration — the thin shell

All in this repo's `src-tauri/`. **None of the above engine work depends on this**; this is purely about hooking the engine into the desktop app's command/event surface. Small in scope (~250 LOC of glue) because the engine already exposes everything.

## B1. Add the path dependency

`postcrate/src-tauri/Cargo.toml`:
```toml
postcrate-core = { path = "../../postcrate-core/crates/postcrate-core" }
```
Plus `tokio`, `serde`, `serde_json` already present.

## B2. `glue.rs` — `TauriEventSink`

`src-tauri/src/glue.rs`. Implement `EventSink` for a struct holding `AppHandle`. Map each `CoreEvent` variant to a Tauri event name (`postcrate://new-email`, `postcrate://mailbox-state-changed`, etc.) and `emit` with the payload. Tolerate emit failures (log + continue) so a failed emit never poisons engine state.

## B3. Command shims — `src-tauri/src/commands/`

One file per concern: `server.rs`, `mailboxes.rs`, `emails.rs`, `chaos.rs`, `bounces.rs`, `settings.rs`, `audit.rs`. Each `#[tauri::command]` is ~3 lines: extract `Arc<Service>` from state, call the matching method, `map_err(|e| e.to_string())`.

Register them all in `lib.rs::run()` via a `commands::register(builder)` helper.

## B4. Boot in `setup()`

In the existing `lib.rs::run()` setup hook:

1. Resolve data dir via Tauri's `path` API → `~/Library/Application Support/Postcrate` on macOS, etc.
2. Build `CoreConfig::for_data_dir(...)`.
3. Build `Service` with a `TauriEventSink { app: app.handle() }`.
4. Call `service.start_all()`.
5. `app.manage(service)` so commands can extract it via `tauri::State`.
6. On window-close or app-quit, call `service.stop_all()`.

## B5. Tray icon

`PROD.md §9.1` + `§10.4`. macOS template image so it adapts to light/dark menu bars. Menu items: status line (`Listening on :1025`), Start/Stop server toggle, Unread count (informational), Show window, Clear inbox, Settings, Quit. Tauri 2's tray API + a small `tray.rs` module.

## B6. Native notifications

`PROD.md §9.1`. Tauri 2's notification plugin. On `postcrate://new-email` event, optionally fire an OS notification (off by default per `settings.notifications.desktopOnNewEmail`). Click-through opens the window directly to that email (FR-ECO-50).

## B7. Launch-at-login

`PROD.md §9.1`. Tauri 2 has `tauri-plugin-autostart`. Toggle bound to `settings.general.launchAtLogin`.

---

# C. Frontend work

All in `src/`. Replace mock data with live commands + subscribed events. The UI shell already exists from prior commits — most of this is wiring, not net-new components.

## C1. Replace mock data sources

- `src/data/mailboxes.ts` → delete. Replace with a `useMailboxes(projectId)` SWR hook that calls `invoke('list_mailboxes', { projectId })` and subscribes to `postcrate://mailbox-state-changed` to invalidate.
- `src/data/projects.ts` stays — projects are organizational and frontend-only.
- `src/stores/use-server-store.ts` → real `server_status` command + `postcrate://server-status-changed` subscription. Drop the persisted `running: true` boolean.

## C2. Inbox views (currently empty `PageEmpty` placeholders)

- `src/pages/inbox/index.tsx` — the actual three-pane shell from `PROD.md §10.3`. Email list (sender / subject / preview / time) + detail pane with HTML/Text/Raw/Headers tabs.
- HTML rendering in a sandboxed iframe with `sandbox="allow-same-origin"` only (`PROD.md §11`, NFR-SEC-02).
- Live updates: subscribe to `postcrate://new-email` and prepend.
- Keyboard model from `PROD.md §10.5`: j/k navigation, Enter to focus detail, `1234` to switch tabs, `/` to focus search, `cmd+k` command palette, `cmd+shift+delete` to clear.

## C3. Mailboxes page

`src/pages/mailboxes/index.tsx`. Real list with create/edit/delete + ephemeral creation flow. The existing `MailboxSwitcher` in the sidebar stays as-is — just feed it the real data.

## C4. Preferences

The 9-section preferences window is already built (`src/pages/preferences/`). For the 4 backend-owned sections (`network`, `agents`, `inbox`, `advanced`), replace the zustand `update()` writes with `invoke('update_network_settings', patch)` etc. and subscribe to `postcrate://settings-changed` to keep multiple windows in sync. The 5 frontend-only sections (`appearance`, `general`, `notifications`, `privacy`, `updates`) keep their current behavior.

## C5. Chaos + bounce UI

New panels under the mailboxes flow (probably accessed via a "Test scenarios" sub-route or per-mailbox detail page). Forms for the `ChaosConfig` knobs and a bounce-rule list with add/edit/enable/disable.

## C6. Search

`src/components/top-bar.tsx`'s `SearchTrigger` already exists. Wire to `invoke('search_emails', { q, mailboxId, limit })`. Add the command palette (`cmd+k`) — `cmdk` is already in deps.

## C7. UX features from `REQ.md §7`

Smart-inbox features that compound into the "this is the inbox I want to live in" feeling. Mostly frontend, but engine surface for state persistence:

- **Email diff** (FR-UX-01) — select two emails with Shift, side-by-side diff of subject/headers/HTML source/plain text/rendered HTML. Pure frontend; backend already returns full detail.
- **Threading** (FR-UX-20) — group same-recipient + similar-subject emails. Pure frontend if we apply heuristics over the list response.
- **Auto-tagging** (FR-UX-30) — auth / billing / notification / marketing / system / unknown. Engine-side detector (`core::tagging`) + a `tag` column or a separate `email_tags` table.
- **Pinning + starring** (FR-UX-40) — adds two flags to the `emails` row + clear-inbox behavior changes (`clear_mailbox` preserves pinned).
- **Annotations** (FR-UX-50) — per-email free-text notes. New `email_notes` table.
- **Header explorer** (FR-UX-70) — click any header to see its RFC reference + example. Frontend-only since the reference data ships with the app.

## C8. Visual polish

`PROD.md §11`. The UI shell from prior commits already aims at this direction (vibrancy, density, single accent). What's left:

- Empty states with framework setup snippets (`PROD.md §10.1`)
- "Send me a test email" button on the empty inbox
- Motion polish per `PROD.md §11` ("subtle and functional")
- Rendered email viewport preview toggle (desktop/tablet/mobile widths) — paired with A6 once that lands

---

# D. Editor + ecosystem integrations

Once the HTTP API is solid (after A1), these are reasonably independent.

- **VS Code / Cursor extension** (FR-ECO-01..02) — status bar item with unread count, panel showing inbox + detail, toast on new email, optional inline `sendMail` annotation for Node and Python.
- **JetBrains plugin** (FR-ECO-10) — WebStorm/IntelliJ/PyCharm, feature parity with VS Code.
- **Browser extensions** (FR-ECO-20) — Chrome + Firefox. Show unread count, open inbox in popover or desktop app.
- **Raycast extension + Alfred workflow** (FR-ECO-40..41) — search recent emails, open in Postcrate.

All of these are separate repos under the `postcrate/` GitHub org.

---

# E. Adoption + distribution

Mostly non-engineering — content, outreach, packaging.

- **Mailtrap-compatible API alias layer** (FR-ADOPT-10) — a thin alias router in the HTTP layer that mirrors Mailtrap's read endpoints, so users can swap `MAILTRAP_API_URL` → Postcrate.
- **Per-framework tutorials** (FR-ADOPT-30) — docs site pages for Next.js, NestJS, Django, Rails, Laravel, FastAPI, SvelteKit. Each is an end-to-end walkthrough with a sample repo.
- **Framework-starter integration PRs** (FR-ADOPT-01) — submit PRs to `create-next-app`, Laravel installer, Rails default mailer dev settings, etc.
- **Provider-doc outreach** (FR-ADOPT-20) — Resend, Postmark, SendGrid, Mailgun documentation references to Postcrate as a local-dev option.
- **Template showcase** (FR-ADOPT-40) — MIT-licensed transactional email templates verified against the FR-RENDER-01 client profiles.

## E1. Tauri app distribution

- macOS: signed and notarized `.dmg`, universal binary, Homebrew cask.
- Windows: MSI with EV/OV code-signing cert, Scoop manifest, WinGet.
- Linux: AppImage, `.deb`, `.rpm`, AUR package; Flatpak as stretch.
- GitHub Actions build matrix; Tauri's own GitHub Action handles the heavy lifting.

## E2. Headless binary distribution

- `ghcr.io/postcrate/postcrate-ci` Docker image (covered in A5).
- `brew install postcrate` (separate cask for the daemon vs. the desktop app).
- `cargo install postcrate-server` for Rustaceans.

## E3. Landing page + demo

`PROD.md §14`. Custom domain, signed installer per platform, demo GIF embedded in README, written launch post.

---

# Recommended sequencing

If I were prioritizing my own time:

1. **A1 — engine hardening.** <2 days. Required before anything else builds on the engine.
2. **A2 — MCP server.** Highest strategic leverage. Unowned positioning in the market.
3. **A3 — CLI tooling.** Two weekends. Unlocks scripting workflows even before the desktop app exists.
4. **A4 — Node + Python matchers** (just those two — drop Ruby/Go/PHP until signal demand). FR-TEST-01 prioritized this same way.
5. **A5 — CI distribution.** Docker image + GitHub Action. Cheap once A4 exists.
6. **B — Tauri integration.** A few days of mechanical wiring once the engine is hardened.
7. **C1–C4 — Frontend wiring** (mailboxes, inbox, preferences). Replace mocks.
8. **C2 — Real inbox UI with HTML/Text/Raw/Headers tabs.** The product's defining surface.
9. **A6 — Rendering preview engine** + **C8** — UI for it. The Litmus/Email-on-Acid displacement bet.
10. **D — Editor integrations.** Once the API is stable.
11. **E — Distribution + adoption.** The launch moment.

A6, A7, A8, C5–C7, the rest of A4's matcher languages, and D are all parallelizable once A1+A2+A3 land.

The launch narrative for v2.0 should lead with "**the first SMTP testing tool built for agents**" — that sentence is owned by no one in the market today, and A2 makes it true.

---

_End of roadmap. Update after each major phase ships; archive completed sections to `docs/archive/`._
