import { z } from "zod";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  upsertBounceRule,
  type BounceKind,
  type BounceRule,
} from "@/services/bounce-rules";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";

const INPUT_CLASS = "h-8 text-[12.5px] font-sans placeholder:text-[12.5px]";

const schema = z.object({
  addressPattern: z
    .string()
    .trim()
    .min(1, "Pattern is required")
    .max(256, "Keep it under 256 chars"),
  bounceKind: z.enum(["hard", "soft"] as const),
  smtpCode: z
    .number({ message: "Must be a number" })
    .int("Whole numbers only")
    .min(400, "Must be a 4xx or 5xx code")
    .max(599, "Must be ≤ 599"),
  smtpMessage: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(256, "Keep it under 256 chars"),
  enabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS_BY_KIND: Record<
  BounceKind,
  { smtpCode: number; smtpMessage: string }
> = {
  hard: { smtpCode: 550, smtpMessage: "Mailbox not found" },
  soft: { smtpCode: 450, smtpMessage: "Mailbox temporarily unavailable" },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailboxId: string;
  /** Existing rule to edit. Falsy = create-mode. */
  rule?: BounceRule | null;
};

export function BounceRuleDialog({
  open,
  onOpenChange,
  mailboxId,
  rule,
}: Props) {
  const isEdit = Boolean(rule?.id);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      addressPattern: "",
      bounceKind: "hard",
      smtpCode: DEFAULTS_BY_KIND.hard.smtpCode,
      smtpMessage: DEFAULTS_BY_KIND.hard.smtpMessage,
      enabled: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (rule) {
      form.reset({
        addressPattern: rule.addressPattern,
        bounceKind: rule.bounceKind,
        smtpCode: rule.smtpCode,
        smtpMessage: rule.smtpMessage,
        enabled: rule.enabled ?? true,
      });
    } else {
      form.reset({
        addressPattern: "",
        bounceKind: "hard",
        smtpCode: DEFAULTS_BY_KIND.hard.smtpCode,
        smtpMessage: DEFAULTS_BY_KIND.hard.smtpMessage,
        enabled: true,
      });
    }
  }, [open, rule, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await upsertBounceRule({
        id: rule?.id,
        mailboxId,
        addressPattern: values.addressPattern,
        bounceKind: values.bounceKind,
        smtpCode: values.smtpCode,
        smtpMessage: values.smtpMessage,
        enabled: values.enabled,
      });
      onOpenChange(false);
    } catch (err) {
      reportIpcError(
        err,
        isEdit ? "Couldn't update bounce rule" : "Couldn't create bounce rule",
      );
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
          <DialogTitle>{isEdit ? "Edit bounce rule" : "New bounce rule"}</DialogTitle>
          <DialogDescription>
            Reject mail to addresses matching this pattern with a synthetic SMTP
            response.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3.5"
        >
          <Field
            id="bounce-pattern"
            label="Address pattern"
            hint="Glob over the RCPT address. Examples: *@bounce.test, bob@*"
            error={form.formState.errors.addressPattern?.message}
          >
            <Input
              id="bounce-pattern"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="*@bounce.test"
              className={`${INPUT_CLASS} font-mono`}
              {...form.register("addressPattern")}
            />
          </Field>

          <Field
            id="bounce-kind"
            label="Kind"
            hint="Hard = permanent failure (5xx). Soft = transient (4xx)."
            error={form.formState.errors.bounceKind?.message}
          >
            <Controller
              control={form.control}
              name="bounceKind"
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
                    const kind = v as BounceKind;
                    field.onChange(kind);
                    // Re-seed code/message defaults if the user hasn't
                    // deviated from the previous kind's defaults yet.
                    const prevDefaults = DEFAULTS_BY_KIND[
                      kind === "hard" ? "soft" : "hard"
                    ];
                    const prevCode = form.getValues("smtpCode");
                    const prevMessage = form.getValues("smtpMessage");
                    if (prevCode === prevDefaults.smtpCode) {
                      form.setValue("smtpCode", DEFAULTS_BY_KIND[kind].smtpCode);
                    }
                    if (prevMessage === prevDefaults.smtpMessage) {
                      form.setValue(
                        "smtpMessage",
                        DEFAULTS_BY_KIND[kind].smtpMessage,
                      );
                    }
                  }}
                >
                  <ToggleGroupItem
                    value="hard"
                    className="h-8 px-2.5 text-[12px]"
                  >
                    Hard (5xx)
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="soft"
                    className="h-8 px-2.5 text-[12px]"
                  >
                    Soft (4xx)
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          </Field>

          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <Field
              id="bounce-code"
              label="Code"
              hint="SMTP status."
              error={form.formState.errors.smtpCode?.message}
            >
              <Input
                id="bounce-code"
                type="number"
                inputMode="numeric"
                min={400}
                max={599}
                className={`${INPUT_CLASS} tabular-nums`}
                {...form.register("smtpCode", { valueAsNumber: true })}
              />
            </Field>
            <Field
              id="bounce-message"
              label="Message"
              hint="Returned verbatim to the SMTP client."
              error={form.formState.errors.smtpMessage?.message}
            >
              <Input
                id="bounce-message"
                autoComplete="off"
                spellCheck={false}
                className={INPUT_CLASS}
                {...form.register("smtpMessage")}
              />
            </Field>
          </div>

          <label
            htmlFor="bounce-enabled"
            className="flex cursor-pointer items-center justify-between gap-3 py-1"
          >
            <span className="min-w-0">
              <span className="text-foreground text-[13px] font-medium">
                Enabled
              </span>
              <span className="text-muted-foreground block text-[11.5px] leading-snug">
                Disable to keep the rule but stop matching new mail.
              </span>
            </span>
            <Controller
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <Switch
                  id="bounce-enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </label>

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
              {submitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create rule"}
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
