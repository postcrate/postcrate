import { cn } from "@/lib/utils";
import { type Mailbox } from "@/services/mailbox";

export type MailboxStatus = "running" | "stopped" | "failed" | "expired";

/**
 * Pick which of the four states a mailbox is in right now. Order
 * matters: `failed` wins over `stopped` (a bind error is louder than
 * the user-intent flag), and `expired` only applies to ephemerals.
 *
 * Note: `paused` and `failed` are independent on the engine side, so a
 * mailbox can be both "user-stopped" *and* "failed last bind." We
 * surface the failure in that case because it's the actionable signal.
 */
export function deriveStatus(mailbox: Mailbox): MailboxStatus {
  if (mailbox.failed) return "failed";
  if (
    mailbox.kind === "ephemeral" &&
    mailbox.expiresAt != null &&
    mailbox.expiresAt <= Date.now()
  ) {
    return "expired";
  }
  if (mailbox.paused) return "stopped";
  return "running";
}

const STATUS_LABEL: Record<MailboxStatus, string> = {
  running: "Running",
  stopped: "Stopped",
  failed: "Failed",
  expired: "Expired",
};

type Props = {
  status: MailboxStatus;
  className?: string;
  /**
   * Optional reason copy shown via the browser tooltip — used by the
   * row to expose `mailbox.failReason` without adding a separate UI
   * surface. Keep this short (engine errors fit on one line).
   */
  title?: string;
};

/**
 * Compact runtime-state badge for the table. Text-only — pill color
 * carries the state, no extra dot. Pills are mutually exclusive, so
 * the row decides which Start/Stop action to show based on the same
 * `deriveStatus` output.
 */
export function StatusPill({ status, className, title }: Props) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium tracking-tight",
        status === "running" && "bg-success/12 text-success",
        status === "stopped" && "bg-muted text-muted-foreground",
        status === "failed" && "bg-destructive/12 text-destructive",
        status === "expired" && "bg-warn/15 text-warn",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
