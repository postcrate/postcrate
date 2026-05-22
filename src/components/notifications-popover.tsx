import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BellIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { useAudit, type AuditEntry } from "@/services/audit";
import { actionMeta } from "@/pages/audit/components/action-meta";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount: number;
};

const MAX_VISIBLE = 10;

export function NotificationsPopover({ open, onOpenChange, unreadCount }: Props) {
  const navigate = useNavigate();
  const { entries } = useAudit();

  const noteworthy = useMemo(() => {
    if (!entries) return [];
    return entries
      .filter((e) => actionMeta(e.action).tone === "warn")
      .slice(0, MAX_VISIBLE);
  }, [entries]);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} new`
              : "Notifications"
          }
          className="text-muted-foreground hover:bg-muted hover:text-foreground relative inline-flex size-7 items-center justify-center rounded-md transition-colors outline-none"
        >
          <BellIcon size={14} weight="regular" />
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="bg-destructive absolute top-1 right-1 size-1.5 rounded-full"
            />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-80 p-0"
      >
        <header className="border-border/60 flex items-center justify-between border-b px-3 py-2">
          <span className="text-foreground text-[12.5px] font-medium">
            Notifications
          </span>
          {noteworthy.length > 0 ? (
            <span className="text-muted-foreground text-[11px]">
              Last {noteworthy.length}
            </span>
          ) : null}
        </header>

        {noteworthy.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {noteworthy.map((entry) => (
              <NotificationRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}

        <footer className="border-border/60 border-t">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate("/audit");
            }}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center justify-center px-3 py-2 text-[12px] transition-colors"
          >
            Open audit log
          </button>
        </footer>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({ entry }: { entry: AuditEntry }) {
  const meta = actionMeta(entry.action);
  const Icon = meta.Icon;
  return (
    <li className="hover:bg-muted/50 flex items-start gap-2.5 px-3 py-2 transition-colors">
      <span
        className={cn(
          "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full",
          meta.tone === "warn" && "bg-warn/12 text-warn",
          meta.tone === "destructive" && "bg-destructive/12 text-destructive",
          meta.tone === "default" && "bg-muted text-muted-foreground",
        )}
      >
        <Icon size={11} weight="bold" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-foreground text-[12.5px] leading-tight">
          {meta.verb}
        </div>
        {entry.targetId ? (
          <div className="text-muted-foreground truncate font-mono text-[11px]">
            {entry.targetId}
          </div>
        ) : null}
      </div>
      <span className="text-muted-foreground/80 mt-0.5 shrink-0 text-[11px] tabular-nums">
        {formatRelative(entry.at)}
      </span>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="px-4 py-8 text-center">
      <div className="text-foreground text-[12.5px]">Nothing to report</div>
      <div className="text-muted-foreground mt-1 text-[11.5px]">
        Failures and other things worth your attention show up here.
      </div>
    </div>
  );
}

function formatRelative(timestampMs: number): string {
  const seconds = Math.max(1, Math.round((Date.now() - timestampMs) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
