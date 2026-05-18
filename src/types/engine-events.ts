/**
 * TypeScript mirror of `postcrate_core::CoreEvent`.
 *
 * Hand-written because no Tauri command currently returns `CoreEvent`,
 * so tauri-specta has no entry point to emit it. The serialized shape
 * is stable (the engine's serde tags), so this file is the contract.
 */

import type {
  AuditEntry,
  EmailSummary,
  ServerStatus,
} from "@/lib/bridge/bindings";

export type MailboxStateChange =
  | { kind: "created" }
  | { kind: "updated" }
  | { kind: "deleted" }
  | { kind: "started" }
  | { kind: "stopped" }
  | { kind: "expired" }
  | { kind: "failed"; error: string };

export type SettingsSection = "network" | "agents" | "inbox" | "advanced";

export type CoreEvent =
  | { kind: "newEmail"; mailboxId: string; email: EmailSummary }
  | { kind: "mailboxStateChanged"; mailboxId: string; change: MailboxStateChange }
  | { kind: "serverStatusChanged"; status: ServerStatus }
  | { kind: "settingsChanged"; section: SettingsSection }
  | { kind: "auditAppended"; entry: AuditEntry };
