/**
 * Engine status feature module.
 *
 * Mirrors the `services/*Sync` pattern: one boot-time listener that
 * funnels `ServerStatusChanged` events into a zustand store so any
 * component can subscribe without re-binding the event itself.
 */

import type { UnlistenFn } from "@tauri-apps/api/event";

import { useEffect } from "react";

import { EngineEvent, listenEngine } from "@/lib/bridge/events";
import { useEngineStatusStore } from "@/stores/use-engine-status-store";

/** Selector convenience for consumers that only need the snapshot. */
export function useEngineStatus() {
  return useEngineStatusStore((s) => s.status);
}

/**
 * Wire the engine's `ServerStatusChanged` event into
 * `useEngineStatusStore`. Install once at React root.
 */
export function useEngineStatusSync(): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    const setStatus = useEngineStatusStore.getState().setStatus;

    listenEngine(EngineEvent.ServerStatusChanged, (event) => {
      if (event.payload.kind !== "serverStatusChanged") return;
      setStatus(event.payload.status);
    }).then((un) => {
      if (cancelled) un();
      else unlisten = un;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
