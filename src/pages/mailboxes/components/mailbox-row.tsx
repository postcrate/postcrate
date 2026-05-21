import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  CaretRightIcon,
  PlayIcon,
  StopIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { reportIpcError } from "@/lib/bridge/ipc";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  exportMailboxRecording,
  replayRecordingFromFile,
} from "@/services/recording";
import {
  clearMailbox,
  purgeMailbox,
  startMailbox,
  stopMailbox,
  type Mailbox,
} from "@/services/mailbox";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

import { KindBadge, KindDot } from "./kind";
import { deriveStatus, StatusPill } from "./status";

type Props = {
  mailbox: Mailbox;
  selected: boolean;
  active: boolean;
  onToggleSelected: () => void;
  onEdit: (mailbox: Mailbox) => void;
  onDelete: (mailbox: Mailbox) => void;
};

export function MailboxRow({
  mailbox,
  selected,
  active,
  onToggleSelected,
  onEdit,
  onDelete,
}: Props) {
  const ttl = useTtlCountdown(mailbox);
  const lastSeen = mailbox.count > 0 ? formatTime(mailbox.createdAt) : "—";
  const status = deriveStatus(mailbox);

  async function copyConnection() {
    try {
      await navigator.clipboard.writeText(connectionString(mailbox));
      toast.success("Connection copied", {
        description: connectionString(mailbox),
      });
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }

  async function handleClear() {
    try {
      const count = await clearMailbox(mailbox.id);
      toast.success(
        count === 0
          ? "Already empty"
          : `Cleared ${count} ${count === 1 ? "message" : "messages"}`,
      );
    } catch (err) {
      reportIpcError(err, "Couldn't clear mailbox");
    }
  }

  async function handlePurge() {
    try {
      const count = await purgeMailbox(mailbox.id);
      toast.success(
        count === 0
          ? "Nothing to purge"
          : `Purged ${count} ${count === 1 ? "message" : "messages"} and attachments`,
      );

    } catch (err) {
      reportIpcError(err, "Couldn't purge mailbox");
    }
  }

  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  async function handleStart() {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    try {
      await startMailbox(mailbox.id);
      toast.success(`Started on ${connectionString(mailbox)}`);
    } catch (err) {
      // Most common: the port was taken by another process while the
      // mailbox was stopped. Engine's PortInUse error surfaces here.
      reportIpcError(err, "Couldn't start mailbox");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function handleStop() {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    try {
      await stopMailbox(mailbox.id);
      toast.success(`Stopped. Port ${mailbox.port} released`);
    } catch (err) {
      reportIpcError(err, "Couldn't stop mailbox");
    } finally {
      setLifecycleBusy(false);
    }
  }

  // A mailbox is "off" when the listener isn't running for any reason
  // — user-stopped (paused) or a failed bind. In both cases the
  // primary action is Start; the engine clears the failure on success.
  const isOff = status === "stopped" || status === "failed";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          tabIndex={0}
          onClick={(e) => {
            // Don't trigger edit when clicking the checkbox cell.
            const target = e.target as HTMLElement;
            if (target.closest('[data-slot="checkbox"]')) return;
            onEdit(mailbox);
          }}
          data-state={selected ? "selected" : undefined}
          data-active={active ? "true" : undefined}
          className={cn(
            "group cursor-pointer",
            mailbox.failed && "bg-destructive/5",
          )}
        >
          <TableCell
            className="py-2.5 pr-0 pl-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={onToggleSelected}
              aria-label={`Select ${mailbox.name}`}
            />
          </TableCell>
          <TableCell className="py-2.5">
            <div className="flex items-center gap-2.5">
              <KindDot kind={mailbox.kind} />
              <span className="text-foreground text-[12.5px] font-medium">
                {mailbox.name}
              </span>
            </div>
          </TableCell>
          <TableCell
            className="py-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <StatusPill
                status={status}
                title={
                  status === "failed" && mailbox.failReason
                    ? mailbox.failReason
                    : undefined
                }
                className={cn(
                  status === "failed" && "max-w-[140px] truncate",
                )}
              />
              {status !== "expired" ? (
                <LifecycleButton
                  isOff={isOff}
                  busy={lifecycleBusy}
                  mailboxName={mailbox.name}
                  onStart={handleStart}
                  onStop={handleStop}
                />
              ) : null}
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground py-2.5 font-mono text-[12px] tabular-nums">
            {connectionString(mailbox)}
          </TableCell>
          <TableCell className="py-2.5">
            <KindBadge kind={mailbox.kind} />
          </TableCell>
          <TableCell className="text-muted-foreground py-2.5 text-[12px]">
            <span className="text-muted-foreground/60">—</span>
          </TableCell>
          <TableCell className="text-foreground/90 py-2.5 text-right font-mono text-[12.5px] tabular-nums">
            {mailbox.count}
          </TableCell>
          <TableCell className="text-muted-foreground py-2.5 font-mono text-[12px] tabular-nums">
            {ttl}
          </TableCell>
          <TableCell className="text-muted-foreground py-2.5 font-mono text-[12px] tabular-nums">
            {lastSeen}
          </TableCell>
          <TableCell className="py-2.5 pr-3 text-right">
            <CaretRightIcon
              size={12}
              weight="bold"
              className="text-muted-foreground/40 group-hover:text-muted-foreground inline-block transition-colors"
            />
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      <ContextMenuContent className="min-w-44">
        <ContextMenuItem onSelect={() => onEdit(mailbox)}>
          Edit…
        </ContextMenuItem>
        <ContextMenuItem onSelect={copyConnection}>
          Copy SMTP URL
        </ContextMenuItem>
        <ContextMenuSeparator />
        {isOff ? (
          <ContextMenuItem onSelect={handleStart}>
            Start mailbox
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={handleStop}>
            Stop mailbox
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() =>
            void exportMailboxRecording(mailbox.id, mailbox.name)
          }
        >
          Export recording…
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => void replayRecordingFromFile(mailbox.id)}
        >
          Replay from file…
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleClear}>
          Clear mail
        </ContextMenuItem>
        <ContextMenuItem onSelect={handlePurge}>
          Purge mail + attachments
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onSelect={() => onDelete(mailbox)}
        >
          Delete mailbox…
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

type LifecycleButtonProps = {
  isOff: boolean;
  busy: boolean;
  mailboxName: string;
  onStart: () => void;
  onStop: () => void;
};

/**
 * Inline Start/Stop control that lives next to the status pill on
 * every row. Mirrors the bottom-of-sidebar styling so the two
 * affordances feel like the same control surface: brand-tinted Play
 * when the mailbox is off (to invite the action), muted Stop when
 * it's running (subtle, hover-highlighted). Disabled during the
 * in-flight IPC so a fast double-click can't race itself.
 */
function LifecycleButton({
  isOff,
  busy,
  mailboxName,
  onStart,
  onStop,
}: LifecycleButtonProps) {
  const Icon = isOff ? PlayIcon : StopIcon;
  const label = isOff ? `Start ${mailboxName}` : `Stop ${mailboxName}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            if (isOff) onStart();
            else onStop();
          }}
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-md transition-colors",
            "outline-none disabled:cursor-not-allowed disabled:opacity-40",
            isOff
              ? "text-brand bg-brand/12 hover:bg-brand/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon size={10} weight="fill" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function connectionString(mailbox: Mailbox): string {
  return `127.0.0.1:${mailbox.port}`;
}

function formatTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => n.toString().padStart(2, "0"))
    .join(":");
}

function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return "expiring";
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return `${m}m ${s.toString().padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${(m % 60).toString().padStart(2, "0")}m`;
}

function useTtlCountdown(mailbox: Mailbox): string {
  const [, tick] = useState(0);
  useEffect(() => {
    if (mailbox.kind !== "ephemeral" || !mailbox.expiresAt) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [mailbox.kind, mailbox.expiresAt]);

  if (mailbox.kind !== "ephemeral" || !mailbox.expiresAt) return "—";
  const remaining = Math.max(0, Math.floor((mailbox.expiresAt - Date.now()) / 1000));
  return formatDuration(remaining);
}
