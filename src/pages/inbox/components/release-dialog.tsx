import { toast } from "sonner";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { releaseEmail } from "@/services/email";
import { reportIpcError } from "@/lib/bridge/ipc";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Forward a captured email to an external SMTP relay. The form mirrors
 * the `RelayConfig` DTO from the engine — host, port, recipient.
 */
export function ReleaseDialog({ emailId, open, onOpenChange }: Props) {
  const [host, setHost] = useState("smtp.resend.com");
  const [port, setPort] = useState(587);
  const [to, setTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) return;
    setTo("");
    setSubmitting(false);
  }, [open]);

  async function submit() {
    if (!emailId) return;
    setSubmitting(true);
    try {
      await releaseEmail(emailId, to.trim(), { host: host.trim(), port });
      toast.success(`Released to ${to.trim()}`);
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't release message");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    host.trim().length > 0 && to.trim().length > 0 && port > 0 && !submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release to relay</DialogTitle>
          <DialogDescription>
            Forward this captured message to an external SMTP relay. The
            relay credentials live in your engine settings.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) submit();
          }}
          className="space-y-3"
        >
          <Field label="Relay host" htmlFor="relay-host">
            <Input
              id="relay-host"
              value={host}
              onChange={(e) => setHost(e.currentTarget.value)}
              placeholder="smtp.example.com"
              className="h-8 text-[12.5px]"
            />
          </Field>

          <Field label="Port" htmlFor="relay-port">
            <Input
              id="relay-port"
              type="number"
              min={1}
              max={65535}
              value={port}
              onChange={(e) => setPort(Number(e.currentTarget.value) || 0)}
              className="h-8 text-[12.5px]"
            />
          </Field>

          <Field label="Recipient" htmlFor="relay-to">
            <Input
              id="relay-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.currentTarget.value)}
              placeholder="you@example.com"
              className="h-8 text-[12.5px]"
            />
          </Field>

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
            <Button type="submit" size="sm" disabled={!canSubmit}>
              {submitting ? "Releasing…" : "Release"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[12px] font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
