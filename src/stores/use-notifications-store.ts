import { create } from "zustand";

/**
 * Tracks new-email events since the user last visited the inbox. Drives
 * the dock badge count. Lives outside `usePreferencesStore` because
 * it's per-session state, never persisted — quitting and relaunching
 * starts at zero.
 */
type State = {
  /** New emails received while the user wasn't on the inbox page. */
  unreadSinceLastVisit: number;
  bump: () => void;
  clear: () => void;
};

export const useNotificationsStore = create<State>((set) => ({
  unreadSinceLastVisit: 0,
  bump: () =>
    set((s) => ({ unreadSinceLastVisit: s.unreadSinceLastVisit + 1 })),
  clear: () => set({ unreadSinceLastVisit: 0 }),
}));
