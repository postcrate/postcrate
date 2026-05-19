import { toast } from "sonner";
import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { replayEmail } from "@/services/email";
import { Button } from "@/components/ui/button";
import { useMailboxes } from "@/services/mailbox";
import { reportIpcError } from "@/lib/bridge/ipc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  emailId: string | null;
  sourceMailboxId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Replay a captured message into another mailbox as if it had just
 * arrived. Useful for fanning a real-world capture into a test mailbox
 * without touching the relay path.
 */
export function ReplayDialog({
  emailId,
  sourceMailboxId,
  open,
  onOpenChange,
}: Props) {
  const { mailboxes } = useMailboxes();
  const [target, setTarget] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) return;
    setTarget("");
    setSubmitting(false);
  }, [open]);

  const candidates = (mailboxes ?? []).filter((m) => m.id !== sourceMailboxId);

  async function submit() {
    if (!emailId || !target) return;
    setSubmitting(true);
    try {
      await replayEmail(emailId, target);
      const name = candidates.find((m) => m.id === target)?.name ?? "mailbox";
      toast.success(`Replayed to ${name}`);
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't replay message");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replay to mailbox</DialogTitle>
          <DialogDescription>
            Pick a mailbox to receive a fresh copy of this message.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (target && !submitting) submit();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Target mailbox</Label>
            {candidates.length === 0 ? (
              <p className="text-muted-foreground text-[12px]">
                No other mailboxes available. Create one to replay into.
              </p>
            ) : (
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="h-8 text-[12.5px]">
                  <SelectValue placeholder="Pick a mailbox…" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className="text-[12.5px]"
                    >
                      {m.name}{" "}
                      <span className="text-muted-foreground ml-2 font-mono text-[11px]">
                        :{m.port}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!target || submitting || candidates.length === 0}
            >
              {submitting ? "Replaying…" : "Replay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
