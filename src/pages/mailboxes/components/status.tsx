import { cn } from "@/lib/utils";
import { type Mailbox } from "@/services/mailbox";

export type MailboxStatus = "active" | "failed" | "expired";

export function deriveStatus(mailbox: Mailbox): MailboxStatus {
  if (mailbox.failed) return "failed";
  if (
    mailbox.kind === "ephemeral" &&
    mailbox.expiresAt != null &&
    mailbox.expiresAt <= Date.now()
  ) {
    return "expired";
  }
  return "active";
}

const STATUS_LABEL: Record<MailboxStatus, string> = {
  active: "Active",
  failed: "Failed",
  expired: "Expired",
};

type Props = {
  status: MailboxStatus;
  className?: string;
};

/**
 * Compact runtime-state badge for the table. Text-only — color of the
 * pill carries the state, no extra dot.
 */
export function StatusPill({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium tracking-tight",
        status === "active" && "bg-success/12 text-success",
        status === "failed" && "bg-destructive/12 text-destructive",
        status === "expired" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
