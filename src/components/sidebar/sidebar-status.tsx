import { toast } from "sonner";
import { useState } from "react";
import { GearIcon, PlayIcon, StopIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { reportIpcError } from "@/lib/bridge/ipc";
import { openPreferencesWindow } from "@/lib/windows";
import { IconButton } from "@/components/icon-button";
import { useViewStore } from "@/stores/use-view-store";
import { useProjectsStore } from "@/stores/use-projects-store";
import { deriveStatus } from "@/pages/mailboxes/components/status";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  startMailbox,
  stopMailbox,
  useMailboxes,
  type Mailbox,
} from "@/services/mailbox";

/**
 * Bottom-of-sidebar status strip. Acts on the *currently visible*
 * mailbox (the one shown in the switcher above) — pressing Stop
 * reflects in the mailbox-list immediately because both surfaces read
 * from the same SWR cache, refreshed by `useMailboxSync` on the
 * engine's `MailboxStateChanged` event.
 *
 * Three visible states:
 *   running  — green pulse + "Listening" label + Stop button (red icon)
 *   stopped  — no dot + "Stopped" label + Start button (brand icon)
 *   failed   — red dot + "Failed" label + Start button (retry)
 *
 * When there's no mailbox at all, the toggle is disabled and the
 * label reads "—".
 */
export function SidebarStatus() {
  const projectId = useProjectsStore((s) => s.currentId);
  const mailboxId = useViewStore((s) => s.mailboxId);
  const { mailboxes } = useMailboxes(projectId);
  const list = mailboxes ?? [];
  const current = list.find((m) => m.id === mailboxId) ?? list[0];

  const [busy, setBusy] = useState(false);

  const status = current ? deriveStatus(current) : null;
  const running = status === "running";
  const ToggleIcon = running ? StopIcon : PlayIcon;
  const toggleLabel = running ? "Stop mailbox" : "Start mailbox";

  async function handleToggle() {
    if (!current || busy) return;
    setBusy(true);
    try {
      if (running) {
        await stopMailbox(current.id);
        toast.success(`Stopped, port ${current.port} released`);
      } else {
        await startMailbox(current.id);
        toast.success(`Listening on 127.0.0.1:${current.port}`);
      }
    } catch (err) {
      reportIpcError(
        err,
        running ? "Couldn't stop mailbox" : "Couldn't start mailbox",
      );
    } finally {
      setBusy(false);
    }
  }

  const portLabel = current ? `:${current.port}` : "—";
  const stateLabel = current
    ? STATE_LABEL[status as Exclude<ReturnType<typeof deriveStatus>, never>]
    : "—";

  return (
    <div className="border-sidebar-border mt-auto flex h-10 shrink-0 items-center gap-1.5 border-t pr-2 pl-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={toggleLabel}
            onClick={handleToggle}
            disabled={!current || busy}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md transition-colors",
              "outline-none disabled:cursor-not-allowed disabled:opacity-40",
              running
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "text-brand bg-brand/12 hover:bg-brand/20",
            )}
          >
            <ToggleIcon size={12} weight="fill" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {current ? toggleLabel : "No mailbox selected"}
        </TooltipContent>
      </Tooltip>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="text-foreground/85 font-mono text-[11px] tabular-nums">
          {portLabel}
        </span>
        <span aria-hidden className="bg-border/80 h-2.5 w-px shrink-0" />
        <StateDot status={status} />
        <span
          className={cn(
            "truncate text-[11px]",
            running ? "text-foreground/70" : "text-muted-foreground/60",
            status === "failed" && "text-destructive/85",
          )}
          title={
            current?.failed && current.failReason
              ? current.failReason
              : undefined
          }
        >
          {stateLabel}
        </span>
      </div>

      <IconButton
        size="sm"
        title="Preferences"
        icon={GearIcon}
        onClick={openPreferencesWindow}
      />
    </div>
  );
}

const STATE_LABEL: Record<NonNullable<ReturnType<typeof deriveStatus>>, string> = {
  running: "Listening",
  stopped: "Stopped",
  failed: "Failed",
  expired: "Expired",
};

/**
 * Tiny status indicator: green pulse for running, red dot for failed,
 * nothing rendered for stopped/expired (the label is enough).
 */
function StateDot({ status }: { status: ReturnType<typeof deriveStatus> | null }) {
  if (status === "running") {
    return (
      <span
        aria-hidden
        className="bg-success motion-safe:animate-[pulse-soft_1.8s_ease-in-out_infinite] size-1.5 shrink-0 rounded-full shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_22%,transparent)]"
      />
    );
  }
  if (status === "failed") {
    return (
      <span
        aria-hidden
        className="bg-destructive size-1.5 shrink-0 rounded-full"
      />
    );
  }
  return null;
}

// Re-exported for the switcher's live-dot, so both surfaces agree on
// what "running" means without dragging in the status-pill component.
export function isMailboxRunning(mailbox: Mailbox | undefined): boolean {
  if (!mailbox) return false;
  return deriveStatus(mailbox) === "running";
}
