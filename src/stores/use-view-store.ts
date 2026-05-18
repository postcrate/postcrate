import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewState = {
  mailboxId: string | null;
  setMailboxId: (id: string | null) => void;
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      mailboxId: null,
      setMailboxId: (mailboxId) => set({ mailboxId }),
    }),
    { name: "postcrate-view" },
  ),
);
