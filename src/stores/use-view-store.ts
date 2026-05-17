import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ViewId } from "@/data/nav-items";

import { DEFAULT_PROJECT_ID } from "@/data/projects";
import { DEFAULT_MAILBOX_ID, getFirstMailboxOfProject } from "@/data/mailboxes";

type ViewState = {
  view: ViewId;
  projectId: string;
  mailboxId: string;
  setView: (view: ViewId) => void;
  setProjectId: (id: string) => void;
  setMailboxId: (id: string) => void;
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      view: "inbox",
      projectId: DEFAULT_PROJECT_ID,
      mailboxId: DEFAULT_MAILBOX_ID,
      setView: (view) => set({ view }),
      setProjectId: (projectId) =>
        set({ projectId, mailboxId: getFirstMailboxOfProject(projectId).id }),
      setMailboxId: (mailboxId) => set({ mailboxId }),
    }),
    { name: "postcrate-view" },
  ),
);
