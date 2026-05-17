import { create } from "zustand";

type AppState = {
  ready: boolean;
  setReady: (ready: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  setReady: (ready) => set({ ready }),
}));
