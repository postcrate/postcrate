import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { clearAudit } from "@/services/audit";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { IntField } from "@/components/int-field";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Fired after the engine confirms the clear. Use to refresh the
   * list view — `clearAudit` deliberately doesn't touch SWR caches.
   */
  onCleared?: (deletedCount: number) => void;
};

export function ClearAuditAlert({ open, onOpenChange, onCleared }: Props) {
  const [olderOnly, setOlderOnly] = useState(true);
  const [days, setDays] = useState(7);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setOlderOnly(true);
      setDays(7);
      setPending(false);
    }
  }, [open]);

  async function confirm() {
    setPending(true);
    try {
      const deleted = await clearAudit(olderOnly ? days : null);
      onCleared?.(deleted);
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't clear audit log");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear audit log?</AlertDialogTitle>
          <AlertDialogDescription>
            Audit entries are kept for diagnostics. Clearing them is permanent.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label
          htmlFor="audit-older-only"
          className="border-border/60 bg-muted/30 -mt-1 flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5"
        >
          <Switch
            id="audit-older-only"
            checked={olderOnly}
            onCheckedChange={setOlderOnly}
          />
          <span className="min-w-0 flex-1 text-left">
            <span className="text-foreground block text-[12.5px] font-medium">
              Only entries older than…
            </span>
            <span className="text-muted-foreground block text-[11.5px] leading-snug">
              Off = clear every entry, including today's.
            </span>
          </span>
        </label>

        <div
          className={cn(
            "flex items-center gap-3 transition-opacity",
            olderOnly ? "opacity-100" : "pointer-events-none opacity-50",
          )}
        >
          <Label htmlFor="audit-days" className="text-[12.5px] font-medium">
            Older than
          </Label>
          <IntField
            id="audit-days"
            value={days}
            onCommit={setDays}
            min={1}
            max={3650}
          />
          <span className="text-muted-foreground text-[12px]">days</span>
        </div>

        <AlertDialogFooter className="mt-1">
          <AlertDialogCancel size="sm" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={confirm}
          >
            {pending ? "Clearing…" : "Clear"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
