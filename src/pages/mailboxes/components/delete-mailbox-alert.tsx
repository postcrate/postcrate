import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import {
  deleteMailbox,
  purgeMailbox,
  type Mailbox,
} from "@/services/mailbox";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

type Props = {
  mailbox: Mailbox | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteMailboxAlert({ mailbox, onOpenChange, onDeleted }: Props) {
  const [alsoPurge, setAlsoPurge] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!mailbox) {
      setAlsoPurge(false);
      setPending(false);
    }
  }, [mailbox]);

  async function confirm() {
    if (!mailbox) return;
    setPending(true);
    try {
      if (alsoPurge) {
        await purgeMailbox(mailbox.id);
      }
      await deleteMailbox(mailbox.id);
      onDeleted?.();
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't delete mailbox");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={mailbox !== null}
      onOpenChange={(o) => !o && onOpenChange(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete mailbox?</AlertDialogTitle>
          <AlertDialogDescription>
            {mailbox ? (
              <>
                The mailbox{" "}
                <span className="text-foreground font-medium">
                  {mailbox.name}
                </span>{" "}
                will be removed and its SMTP listener stopped.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {mailbox && mailbox.count > 0 ? (
          <label
            htmlFor="purge-toggle"
            className="border-border/60 bg-muted/30 -mt-1 flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5"
          >
            <Switch
              id="purge-toggle"
              checked={alsoPurge}
              onCheckedChange={setAlsoPurge}
            />
            <span className="min-w-0 text-left">
              <span className="text-foreground block text-[12.5px] font-medium">
                Also delete stored mail
              </span>
              <span className="text-muted-foreground block text-[11.5px] leading-snug">
                Permanently removes {mailbox.count}{" "}
                {mailbox.count === 1 ? "message" : "messages"} and their
                attachments from disk.
              </span>
            </span>
          </label>
        ) : null}

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
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
