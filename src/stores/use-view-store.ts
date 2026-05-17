import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ViewId } from "@/data/nav-items";

import { DEFAULT_MAILBOX_ID } from "@/data/mailboxes";

type ViewState = {
  view: ViewId;
  mailboxId: string;
  setView: (view: ViewId) => void;
  setMailboxId: (id: string) => void;
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: "inbox",
      mailboxId: DEFAULT_MAILBOX_ID,
      setView: (view) => set({ view }),
      setMailboxId: (mailboxId) => set({ mailboxId }),
    }),
    { name: "postcrate-view" },
  ),
);
