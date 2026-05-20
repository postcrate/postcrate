import { create } from "zustand";

import type { ServerStatus } from "@/lib/bridge/bindings";

/**
 * Live engine status as reported by `engine:server-status-changed`.
 *
 * Distinct from `useServerStore`, which models a *user-controlled*
 * on/off toggle. This store reflects what the engine is actually doing
 * — running mailbox count, whether the HTTP API is up, and any
 * startup/runtime errors. No persistence: the engine is the source of
 * truth and replays its current status on subscribe.
 */
type EngineStatusState = {
  status: ServerStatus | null;
  setStatus: (status: ServerStatus) => void;
};

export const useEngineStatusStore = create<EngineStatusState>()((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
}));
