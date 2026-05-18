import { create } from "zustand";

/**
 * App-level dialog/modal flags. Lives outside any feature module so
 * keyboard shortcuts, the sidebar, top-bar and feature pages can all
 * open the same surfaces without prop-drilling.
 */
type DialogsState = {
  newMailboxOpen: boolean;
  openNewMailbox: () => void;
  closeNewMailbox: () => void;
  setNewMailboxOpen: (open: boolean) => void;
};

export const useDialogsStore = create<DialogsState>((set) => ({
  newMailboxOpen: false,
  openNewMailbox: () => set({ newMailboxOpen: true }),
  closeNewMailbox: () => set({ newMailboxOpen: false }),
  setNewMailboxOpen: (newMailboxOpen) => set({ newMailboxOpen }),
}));
