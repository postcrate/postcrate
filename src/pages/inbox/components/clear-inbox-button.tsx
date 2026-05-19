import { toast } from "sonner";
import { useEffect, useState } from "react";
import { BroomIcon } from "@phosphor-icons/react/dist/ssr";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import { clearMailbox, purgeMailbox, useMailbox } from "@/services/mailbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  mailboxId: string;
};

/**
 * Toolbar action that wipes every message from the active mailbox.
 * Reads the mailbox count itself so the action stays correct under
 * search/filter state (which trims the visible list, not the mailbox).
 * The "also delete attachments" toggle escalates to `purgeMailbox`
 * (drops blobs + vacuums) instead of `clearMailbox` (rows only).
 */
export function ClearInboxButton({ mailboxId }: Props) {
  const { mailbox } = useMailbox(mailboxId);
  const count = mailbox?.count ?? 0;
  const [open, setOpen] = useState(false);
  const [alsoPurge, setAlsoPurge] = useState(false);
  const [pending, setPending] = useState(false);
  const disabled = count === 0;

  useEffect(() => {
    if (!open) {
      setAlsoPurge(false);
      setPending(false);
    }
  }, [open]);

  async function confirm() {
    setPending(true);
    try {
      const deleted = alsoPurge
        ? await purgeMailbox(mailboxId)
        : await clearMailbox(mailboxId);
      toast.success(
        deleted === 0
          ? "Mailbox already empty"
          : `Cleared ${deleted} ${deleted === 1 ? "message" : "messages"}`,
      );
      setOpen(false);
    } catch (err) {
      reportIpcError(err, "Couldn't clear mailbox");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear inbox"
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            <BroomIcon size={14} weight="regular" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear inbox</TooltipContent>
      </Tooltip>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear inbox?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes every captured message from this mailbox. The mailbox
              itself and its SMTP listener stay running.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <label
            htmlFor="purge-attachments"
            className="border-border/60 bg-muted/30 -mt-1 flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5"
          >
            <Switch
              id="purge-attachments"
              checked={alsoPurge}
              onCheckedChange={setAlsoPurge}
            />
            <span className="min-w-0 text-left">
              <span className="text-foreground block text-[12.5px] font-medium">
                Also delete attachments
              </span>
              <span className="text-muted-foreground block text-[11.5px] leading-snug">
                Vacuums the underlying blob store. Slower, but reclaims disk.
              </span>
            </span>
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel size="sm" disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={confirm}
            >
              {pending
                ? "Clearing…"
                : `Clear ${count} ${count === 1 ? "message" : "messages"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
