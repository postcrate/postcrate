import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_MAILBOX_ID } from "@/data/mailboxes";

type ViewState = {
  mailboxId: string;
  setMailboxId: (id: string) => void;
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      mailboxId: DEFAULT_MAILBOX_ID,
      setMailboxId: (mailboxId) => set({ mailboxId }),
    }),
    { name: "postcrate-view" },
  ),
);
