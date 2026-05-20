import { z } from "zod";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import { useMailboxes } from "@/services/mailbox";
import { createWebhook } from "@/services/webhooks";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";

const INPUT_CLASS = "h-8 text-[12.5px] font-sans placeholder:text-[12.5px]";

const schema = z
  .object({
    url: z
      .string()
      .trim()
      .min(1, "URL is required")
      .url("Must be a valid http:// or https:// URL"),
    authHeader: z.string().trim().max(512, "Keep it under 512 chars"),
    scope: z.enum(["all", "mailbox"]),
    mailboxId: z.string().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.scope === "mailbox" && !v.mailboxId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mailboxId"],
        message: "Pick a mailbox",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  url: "",
  authHeader: "",
  scope: "all",
  mailboxId: null,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WebhookFormDialog({ open, onOpenChange }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { mailboxes } = useMailboxes(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) form.reset(DEFAULT_VALUES);
  }, [open, form]);

  const scope = form.watch("scope");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await createWebhook({
        url: values.url,
        authHeader: values.authHeader.length > 0 ? values.authHeader : null,
        mailboxId: values.scope === "mailbox" ? values.mailboxId : null,
        enabled: true,
      });
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't create webhook");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>New webhook</DialogTitle>
          <DialogDescription>
            POST the email payload to a URL whenever new mail arrives.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3.5"
        >
          <Field
            id="webhook-url"
            label="URL"
            hint="Receives a POST with the email JSON payload."
            error={form.formState.errors.url?.message}
          >
            <Input
              id="webhook-url"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="https://example.com/hooks/mail"
              className={INPUT_CLASS}
              {...form.register("url")}
            />
          </Field>

          <Field
            id="webhook-auth"
            label="Authorization header"
            hint="Sent verbatim — e.g. `Bearer abc123` or basic-auth. Optional."
            error={form.formState.errors.authHeader?.message}
          >
            <Input
              id="webhook-auth"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="empty = no auth"
              className={`${INPUT_CLASS} font-mono`}
              {...form.register("authHeader")}
            />
          </Field>

          <Field
            id="webhook-scope"
            label="Scope"
            hint={
              scope === "all"
                ? "Fires for every mailbox in every project."
                : "Fires for one specific mailbox only."
            }
            error={form.formState.errors.scope?.message}
          >
            <Controller
              control={form.control}
              name="scope"
              render={({ field }) => (
                <ToggleGroup
                  type="single"
                  value={field.value}
                  spacing={0}
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onValueChange={(v) => {
                    if (!v) return;
                    field.onChange(v as FormValues["scope"]);
                    if (v === "all") form.setValue("mailboxId", null);
                  }}
                >
                  <ToggleGroupItem
                    value="all"
                    className="h-8 px-2.5 text-[12px]"
                  >
                    All mailboxes
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="mailbox"
                    className="h-8 px-2.5 text-[12px]"
                  >
                    Specific mailbox
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          </Field>

          {scope === "mailbox" ? (
            <Field
              id="webhook-mailbox"
              label="Mailbox"
              hint="Which mailbox's traffic triggers this webhook."
              error={form.formState.errors.mailboxId?.message}
            >
              <Controller
                control={form.control}
                name="mailboxId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger id="webhook-mailbox" className="h-8 w-full">
                      <SelectValue placeholder="Choose a mailbox" />
                    </SelectTrigger>
                    <SelectContent>
                      {(mailboxes ?? []).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}{" "}
                          <span className="text-muted-foreground font-mono text-[11px]">
                            :{m.port}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          ) : null}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating…" : "Create webhook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </Label>
      {children}
      <p
        className={cn(
          "text-[11.5px] leading-snug",
          error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {error ?? hint}
      </p>
    </div>
  );
}
