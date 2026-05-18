import { cn } from "@/lib/utils";
import { type MailboxKind } from "@/services/mailbox";

/** Display label for each kind — engine calls "shared" what users call "named". */
export const KIND_LABEL: Record<MailboxKind, string> = {
  primary: "primary",
  shared: "named",
  ephemeral: "ephemeral",
};

/** Dot color used for inline glyphs (sidebar, table row indicator). */
export const KIND_DOT: Record<MailboxKind, string> = {
  primary: "bg-warn",
  shared: "bg-muted-foreground/60",
  ephemeral: "bg-info",
};

const KIND_PILL: Record<MailboxKind, string> = {
  primary: "bg-warn/15 text-warn",
  shared: "bg-muted text-muted-foreground",
  ephemeral: "bg-info/15 text-info",
};

type Props = {
  kind: MailboxKind;
  className?: string;
};

export function KindBadge({ kind, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium tracking-tight leading-2",
        KIND_PILL[kind],
        className,
      )}
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

export function KindDot({ kind, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2.5 shrink-0 rounded-[3px]",
        KIND_DOT[kind],
        className,
      )}
    />
  );
}
