import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import { useMailboxes } from "@/services/mailbox";
import { createForwardingRule } from "@/services/forwarding";
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
    scope: z.enum(["all", "mailbox"]),
    mailboxId: z.string().nullable(),
    targetAddresses: z
      .array(z.string().email("Each entry must be a valid email"))
      .min(1, "At least one address"),
    relay: z.object({
      host: z.string().trim().min(1, "Relay host is required"),
      port: z
        .number({ message: "Must be a number" })
        .int("Whole numbers only")
        .min(1, "Must be ≥ 1")
        .max(65535, "Must be ≤ 65535"),
    }),
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
  scope: "all",
  mailboxId: null,
  targetAddresses: [],
  relay: { host: "", port: 587 },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ForwardingFormDialog({ open, onOpenChange }: Props) {
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
      await createForwardingRule({
        mailboxId: values.scope === "mailbox" ? values.mailboxId : null,
        targetAddresses: values.targetAddresses,
        relay: {
          host: values.relay.host.trim(),
          port: values.relay.port,
          timeoutSeconds: null,
          allowedRecipients: null,
        },
        enabled: true,
      });
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't create forwarding rule");
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
          <DialogTitle>New forwarding rule</DialogTitle>
          <DialogDescription>
            Relay captured email to one or more upstream addresses.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3.5"
        >
          <Field
            id="fwd-scope"
            label="Scope"
            hint={
              scope === "all"
                ? "Forward mail from every mailbox in every project."
                : "Forward mail from one specific mailbox only."
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
              id="fwd-mailbox"
              label="Mailbox"
              hint="Source mailbox for this rule."
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
                    <SelectTrigger id="fwd-mailbox" className="h-8 w-full">
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

          <Field
            id="fwd-recipients"
            label="Forward to"
            hint="Press Enter or comma to add. Each must be a valid email."
            error={form.formState.errors.targetAddresses?.message}
          >
            <Controller
              control={form.control}
              name="targetAddresses"
              render={({ field }) => (
                <EmailChipInput
                  id="fwd-recipients"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

          <div className="border-border/60 bg-muted/30 space-y-3 rounded-lg border p-3">
            <p className="text-foreground text-[12px] font-medium">
              Relay (upstream SMTP)
            </p>

            <Field
              id="relay-host"
              label="Host"
              hint="e.g. smtp.resend.com, smtp.gmail.com, 127.0.0.1."
              error={form.formState.errors.relay?.host?.message}
            >
              <Input
                id="relay-host"
                autoComplete="off"
                spellCheck={false}
                placeholder="smtp.example.com"
                className={INPUT_CLASS}
                {...form.register("relay.host")}
              />
            </Field>

            <Field
              id="relay-port"
              label="Port"
              hint="25 for legacy, 587 for submission, 1025 for local."
              error={form.formState.errors.relay?.port?.message}
            >
              <Input
                id="relay-port"
                type="number"
                inputMode="numeric"
                min={1}
                max={65535}
                placeholder="587"
                className={`${INPUT_CLASS} tabular-nums`}
                {...form.register("relay.port", { valueAsNumber: true })}
              />
            </Field>
          </div>

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
              {submitting ? "Creating…" : "Create rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ChipProps = {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
};

function EmailChipInput({ id, value, onChange }: ChipProps) {
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  function commit() {
    const candidate = draft.trim().replace(/,$/, "");
    if (!candidate) return;
    if (value.includes(candidate)) {
      setDraft("");
      return;
    }
    onChange([...value, candidate]);
    setDraft("");
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft.length === 0 && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(addr: string) {
    onChange(value.filter((a) => a !== addr));
  }

  return (
    <div
      onClick={() => ref.current?.focus()}
      className={cn(
        "border-input bg-background flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border px-1.5 py-1",
        "focus-within:border-ring focus-within:ring-ring/30 focus-within:ring-2",
      )}
    >
      {value.map((addr) => (
        <span
          key={addr}
          className={cn(
            "border-border/60 bg-muted text-foreground",
            "inline-flex h-5 items-center gap-1 rounded-md border pr-1 pl-1.5 text-[11px]",
          )}
        >
          <span className="font-mono">{addr}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              remove(addr);
            }}
            aria-label={`Remove ${addr}`}
            className="text-muted-foreground hover:text-foreground grid size-3.5 place-items-center"
          >
            <XIcon size={9} weight="bold" />
          </button>
        </span>
      ))}
      <input
        ref={ref}
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? "alice@example.com" : ""}
        autoComplete="off"
        spellCheck={false}
        className="min-w-32 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[12px]"
      />
    </div>
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
