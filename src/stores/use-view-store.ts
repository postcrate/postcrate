import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewState = {
  mailboxId: string | null;
  emailId: string | null;
  setMailboxId: (id: string | null) => void;
  setEmailId: (id: string | null) => void;
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      mailboxId: null,
      emailId: null,
      setMailboxId: (mailboxId) =>
        set((s) =>
          s.mailboxId === mailboxId
            ? { mailboxId }
            : { mailboxId, emailId: null },
        ),
      setEmailId: (emailId) => set({ emailId }),
    }),
    { name: "postcrate-view" },
  ),
);
