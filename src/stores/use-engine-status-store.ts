import { create } from "zustand";

import type { ServerStatus } from "@/lib/bridge/bindings";

/**
 * Live engine status as reported by `engine:server-status-changed`.
 * Reflects what the engine is actually doing — running mailbox count,
 * HTTP API state, and any startup/runtime errors. No persistence: the
 * engine is the source of truth and replays its current status on
 * subscribe. Per-mailbox Start/Stop state lives on the Mailbox row
 * (paused/failed); this store is the process-wide rollup.
 */
type EngineStatusState = {
  status: ServerStatus | null;
  setStatus: (status: ServerStatus) => void;
};

export const useEngineStatusStore = create<EngineStatusState>()((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
}));
