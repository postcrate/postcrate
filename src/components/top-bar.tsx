import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { useAudit } from "@/services/audit";
import { useViewStore } from "@/stores/use-view-store";
import { useMailbox, useMailboxes } from "@/services/mailbox";
import { useProjectsStore } from "@/stores/use-projects-store";
import { actionMeta } from "@/pages/audit/components/action-meta";
import {
  VIEW_SUBTITLES,
  VIEW_TITLES,
  pathnameToViewId,
} from "@/data/nav-items";

import { Breadcrumb } from "./breadcrumb";
import { SearchTrigger } from "./search-trigger";
import { NotificationsPopover } from "./notifications-popover";

type Props = {
  onOpenPalette: () => void;
};

const LAST_SEEN_KEY = "postcrate:notifications-last-seen";

function readLastSeen(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(LAST_SEEN_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function writeLastSeen(value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SEEN_KEY, String(value));
}

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

  const { entries } = useAudit();
  const [lastSeen, setLastSeen] = useState<number>(() => readLastSeen());
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = useMemo(() => {
    if (!entries) return 0;
    let n = 0;
    for (const e of entries) {
      if (e.at <= lastSeen) break;
      if (actionMeta(e.action).tone === "warn") n += 1;
    }
    return n;
  }, [entries, lastSeen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const now = Date.now();
    setLastSeen(now);
    writeLastSeen(now);
  }, [notificationsOpen]);

  return (
    <header
      data-tauri-drag-region
      className="bg-sidebar border-sidebar-border flex h-10 shrink-0 items-center gap-2 border-b pr-2 pl-3"
    >
      <Breadcrumb title={VIEW_TITLES[view]} subtitle={subtitle} />
      <div className="flex-1" />
      <SearchTrigger onOpen={onOpenPalette} />
      <NotificationsPopover
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        unreadCount={unreadCount}
      />
    </header>
  );
}
