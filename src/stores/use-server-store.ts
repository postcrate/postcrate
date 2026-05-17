import { create } from "zustand";
import { persist } from "zustand/middleware";

type ServerState = {
  running: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
};

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      running: true,
      start: () => set({ running: true }),
      stop: () => set({ running: false }),
      toggle: () => set({ running: !get().running }),
    }),
    { name: "postcrate-server" },
  ),
);
