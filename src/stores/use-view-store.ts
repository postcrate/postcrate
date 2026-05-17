import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_PROJECT_ID } from "@/data/projects";
import { DEFAULT_MAILBOX_ID, getFirstMailboxOfProject } from "@/data/mailboxes";

type ViewState = {
  projectId: string;
  mailboxId: string;
  setProjectId: (id: string) => void;
  setMailboxId: (id: string) => void;
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      projectId: DEFAULT_PROJECT_ID,
      mailboxId: DEFAULT_MAILBOX_ID,
      setProjectId: (projectId) =>
        set({ projectId, mailboxId: getFirstMailboxOfProject(projectId).id }),
      setMailboxId: (mailboxId) => set({ mailboxId }),
    }),
    { name: "postcrate-view" },
  ),
);
