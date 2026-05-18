import { useEffect } from "react";
import { type Event, listen, type UnlistenFn } from "@tauri-apps/api/event";

import type { CoreEvent } from "@/types/engine-events";

/**
 * Engine event channels emitted by `TauriEventSink`
 * (src-tauri/src/core/sink.rs). Keep this enum aligned with the Rust
 * `event_name` switch — they're the wire contract.
 */
export const EngineEvent = {
  NewEmail: "engine:new-email",
  MailboxStateChanged: "engine:mailbox-state-changed",
  ServerStatusChanged: "engine:server-status-changed",
  SettingsChanged: "engine:settings-changed",
  AuditAppended: "engine:audit-appended",
} as const;

export type EngineEventName = (typeof EngineEvent)[keyof typeof EngineEvent];

/**
 * Subscribe to an engine event for the lifetime of the component.
 * Auto-unlisten on unmount; safe across re-renders.
 */
export function useEngineEvent(
  name: EngineEventName,
  handler: (event: Event<CoreEvent>) => void,
) {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listen<CoreEvent>(name, handler).then((un) => {
      if (cancelled) un();
      else unlisten = un;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [name, handler]);
}

/** Imperative subscriber for module-level / app-boot listeners. */
export async function listenEngine(
  name: EngineEventName,
  handler: (event: Event<CoreEvent>) => void,
): Promise<UnlistenFn> {
  return listen<CoreEvent>(name, handler);
}
