import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { BellIcon } from "@phosphor-icons/react/dist/ssr";

import { IconButton } from "@/components/icon-button";
import { useViewStore } from "@/stores/use-view-store";
import { useMailbox, useMailboxes } from "@/services/mailbox";
import { useProjectsStore } from "@/stores/use-projects-store";
import {
  VIEW_SUBTITLES,
  VIEW_TITLES,
  pathnameToViewId,
} from "@/data/nav-items";

import { Breadcrumb } from "./breadcrumb";
import { SearchTrigger } from "./search-trigger";

type Props = {
  onOpenPalette: () => void;
};

export function TopBar({ onOpenPalette }: Props) {
  const { pathname } = useLocation();
  const view = pathnameToViewId(pathname);
  const projectId = useProjectsStore((s) => s.currentId);
  const mailboxId = useViewStore((s) => s.mailboxId);
  const { mailbox } = useMailbox(view === "inbox" ? mailboxId : null);
  const { mailboxes } = useMailboxes(view === "mailboxes" ? projectId : null);

  const subtitle =
    view === "inbox"
      ? `${mailbox?.count ?? 0} messages`
      : view === "mailboxes"
        ? mailboxes
          ? `${mailboxes.length} ${mailboxes.length === 1 ? "mailbox" : "mailboxes"}`
          : VIEW_SUBTITLES[view]
        : VIEW_SUBTITLES[view];

  return (
    <header
      data-tauri-drag-region
      className="bg-sidebar border-sidebar-border flex h-10 shrink-0 items-center gap-2 border-b pr-2 pl-3"
    >
      <Breadcrumb title={VIEW_TITLES[view]} subtitle={subtitle} />
      <div className="flex-1" />
      <SearchTrigger onOpen={onOpenPalette} />
      <IconButton
        icon={BellIcon}
        title="Notifications"
        onClick={() => toast("You're all caught up")}
      />
    </header>
  );
}
