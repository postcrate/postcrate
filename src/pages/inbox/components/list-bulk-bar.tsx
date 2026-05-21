import { toast } from "sonner";
import {
  EnvelopeOpenIcon,
  EnvelopeSimpleIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteEmails,
  markEmailsRead,
  setEmailStarred,
  type EmailSummary,
} from "@/services/email";

type Props = {
  selected: EmailSummary[];
  onClear: () => void;
};

/**
 * Sticky footer that appears in the list pane when at least one email
 * is checked. The action buttons are icon-only — the list pane is
 * narrow (down to 280px) and tooltips carry the labels.
 */
export function ListBulkBar({ selected, onClear }: Props) {
  const count = selected.length;
  const allRead = selected.every((e) => e.read);

  async function markRead(read: boolean) {
    const { succeeded, failed } = await markEmailsRead(
      selected.map((e) => e.id),
      read,
    );
    if (failed > 0) {
      toast.error(`Updated ${succeeded} of ${succeeded + failed} messages`);
    } else if (succeeded > 0) {
      toast.success(`Marked ${succeeded} ${read ? "read" : "unread"}`);
    }
    onClear();
  }

  async function starAll() {
    const targets = selected.filter((e) => !e.starred);
    if (targets.length === 0) {
      toast.info("Already starred");
      return;
    }
    const results = await Promise.allSettled(
      targets.map((e) => setEmailStarred(e.id, true)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      reportIpcError(
        new Error(`${failed} couldn't be starred`),
        "Couldn't star messages",
      );
    } else {
      toast.success(
        `Starred ${targets.length} message${targets.length === 1 ? "" : "s"}`,
      );
    }
    onClear();
  }

  async function removeAll() {
    const { succeeded, failed } = await deleteEmails(selected.map((e) => e.id));
    if (failed > 0) {
      toast.error(`Deleted ${succeeded} of ${succeeded + failed} messages`);
    } else if (succeeded > 0) {
      toast.success(
        `Deleted ${succeeded} message${succeeded === 1 ? "" : "s"}`,
      );
    }
    onClear();
  }

  const readLabel = allRead ? "Mark unread" : "Mark read";

  return (
    <div className="border-border/60 bg-muted/40 flex h-11 shrink-0 items-center gap-1 border-t px-3">
      <span className="text-foreground mr-1 text-[12.5px] font-medium tabular-nums">
        {count} selected
      </span>
      <ActionButton label={readLabel} onClick={() => markRead(!allRead)}>
        {allRead ? (
          <EnvelopeSimpleIcon size={14} weight="regular" />
        ) : (
          <EnvelopeOpenIcon size={14} weight="regular" />
        )}
      </ActionButton>
      <ActionButton label="Star" onClick={starAll}>
        <StarIcon size={14} weight="regular" />
      </ActionButton>
      <ActionButton label="Delete" destructive onClick={removeAll}>
        <TrashIcon size={14} weight="regular" />
      </ActionButton>
      <ActionButton
        label="Clear selection"
        className="ml-auto"
        onClick={onClear}
      >
        <XIcon size={14} weight="regular" />
      </ActionButton>
    </div>
  );
}

function ActionButton({
  label,
  destructive,
  className,
  onClick,
  children,
}: {
  label: string;
  destructive?: boolean;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className={cn(
            destructive &&
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            className,
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
