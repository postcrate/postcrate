import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { suggestName } from "@/lib/suggest";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { useProjectsStore } from "@/stores/use-projects-store";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  createMailbox,
  updateMailbox,
  useSuggestedPort,
  type Mailbox,
  type MailboxKind,
} from "@/services/mailbox";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";

import { KindDot, KIND_LABEL } from "./kind";

const INPUT_CLASS = "h-8 text-[12.5px] font-sans placeholder:text-[12.5px]";

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

const optionalNumber = (min: number, max: number) =>
  z
    .number({ message: "Enter a number" })
    .int("Use whole numbers")
    .min(min, `Must be ≥ ${min}`)
    .max(max, `Must be ≤ ${max}`)
    .nullable();

const TTL_MIN_SECONDS = 10;
const TTL_MAX_SECONDS = 86400 * 30;

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Give the mailbox a name")
      .max(48, "Keep it under 48 characters")
      .regex(NAME_PATTERN, "Use letters, numbers, and hyphens"),
    kind: z.enum(["primary", "shared", "ephemeral"] as const),
    port: optionalNumber(1, 65535),
    // Field-conditional: only ephemerals require a TTL in range.
    // For other kinds the form may carry whatever stale value was
    // persisted (or none), and the submit handler will null it out
    // before sending — so we accept any number/null at the base level
    // and only enforce the real range in `superRefine` below.
    ttlSeconds: z.number().int().nullable(),
    implicitTls: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.kind !== "ephemeral") return;
    const ttl = values.ttlSeconds;
    if (ttl == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ttlSeconds"],
        message: "Ephemeral mailboxes need a TTL",
      });
      return;
    }
    if (ttl < TTL_MIN_SECONDS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ttlSeconds"],
        message: `Must be ≥ ${TTL_MIN_SECONDS} seconds`,
      });
    } else if (ttl > TTL_MAX_SECONDS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ttlSeconds"],
        message: "Max is 30 days",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const nullableNumberSetter = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const DEFAULT_VALUES: FormValues = {
  name: "",
  kind: "primary",
  port: null,
  ttlSeconds: null,
  implicitTls: false,
};

type CreateProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create";
  mailbox?: never;
  onSaved?: (mailbox: Mailbox) => void;
};

type EditProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "edit";
  mailbox: Mailbox;
  onSaved?: (mailbox: Mailbox) => void;
};

type Props = CreateProps | EditProps;

export function MailboxFormDialog(props: Props) {
  const { open, onOpenChange } = props;
  const isEdit = props.mode === "edit";

  const currentProjectId = useProjectsStore((s) => s.currentId);
  const [submitting, setSubmitting] = useState(false);

  // Engine picks the next free port: skips DB-known ones AND probe-
  // binds each candidate, so the suggestion accounts for processes
  // outside this app too. Advisory — `createMailbox` is the
  // authoritative claim. We refresh on each open so a stale cached
  // suggestion can't outlive a manual port grab elsewhere.
  // Skip the suggestion in edit mode — the user isn't picking a port
  // from scratch, they're editing an existing one. Fetching here just
  // adds an IPC round-trip and extra re-renders for no UI gain.
  const {
    port: suggested,
    isLoading: suggestionLoading,
    error: suggestionError,
    refresh: refreshSuggested,
  } = useSuggestedPort(null, { enabled: !isEdit });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: isEdit
      ? {
          name: props.mailbox.name,
          kind: props.mailbox.kind,
          port: props.mailbox.port ?? null,
          ttlSeconds: props.mailbox.ttlSeconds ?? null,
          implicitTls: props.mailbox.implicitTls,
        }
      : DEFAULT_VALUES,
  });

  // Re-seed only on open toggle / edited-mailbox change. The port
  // field starts empty in the create flow and is filled in by the
  // separate "suggestion arrived" effect below — that way the user
  // sees a momentary "Finding free port…" hint instead of a stale
  // value that gets overwritten under their cursor.
  const editingId = isEdit ? props.mailbox.id : null;
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.reset({
        name: props.mailbox.name,
        kind: props.mailbox.kind,
        port: props.mailbox.port ?? null,
        ttlSeconds: props.mailbox.ttlSeconds ?? null,
        implicitTls: props.mailbox.implicitTls,
      });
    } else {
      form.reset({
        name: suggestName(),
        kind: "primary",
        port: null,
        ttlSeconds: null,
        implicitTls: false,
      });
      // Force a fresh fetch each time the dialog opens — a value
      // cached from an earlier session might already be taken now.
      void refreshSuggested();
    }
  }, [open, editingId, isEdit, form, refreshSuggested]);

  // Populate the port field once the engine has a suggestion, but
  // only if the user hasn't typed something in the meantime.
  useEffect(() => {
    if (!open || isEdit || suggested == null) return;
    if (form.formState.dirtyFields.port) return;
    if (form.getValues("port") != null) return;
    form.setValue("port", suggested);
  }, [open, isEdit, suggested, form]);

  const kind = form.watch("kind");

  /**
   * Fires when zod validation blocks submission. In edit mode the
   * `kind` and `implicitTls` fields aren't rendered, so an error on
   * them would otherwise be invisible — the dialog would look like
   * it ignored the click. Surface every error path explicitly.
   */
  function onInvalid(errors: typeof form.formState.errors) {
    const first = Object.values(errors)[0]?.message ?? "Check the form for errors";
    toast.error("Couldn't save changes", { description: first });
    // Helpful when the error isn't on a visible field — devtools shows
    // the full shape including which key failed and why.
    console.warn("mailbox form invalid", errors);
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (isEdit) {
        const updated = await updateMailbox(props.mailbox.id, {
          name: values.name !== props.mailbox.name ? values.name : null,
          port: values.port,
          ttlSeconds: values.kind === "ephemeral" ? values.ttlSeconds : null,
        });
        props.onSaved?.(updated);
      } else {
        if (!currentProjectId) {
          throw new Error("Pick a project first");
        }
        const created = await createMailbox({
          projectId: currentProjectId,
          name: values.name,
          kind: values.kind,
          port: values.port,
          ttlSeconds: values.kind === "ephemeral" ? values.ttlSeconds : null,
          implicitTls: values.implicitTls,
        });
        props.onSaved?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      reportIpcError(
        err,
        isEdit ? "Couldn't update mailbox" : "Couldn't create mailbox",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const title = isEdit ? "Edit mailbox" : "New mailbox";
  const description = isEdit
    ? "Rename it, change the port, or extend the TTL."
    : "A mailbox captures SMTP traffic on one port. Ephemerals clean up after their TTL.";
  const submitLabel = isEdit
    ? submitting
      ? "Saving…"
      : "Save changes"
    : submitting
      ? "Creating…"
      : "Create mailbox";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="flex flex-col gap-3.5"
        >
          <Field
            id="mailbox-name"
            label="Name"
            hint="Letters, numbers, and hyphens."
            error={form.formState.errors.name?.message}
          >
            <Input
              id="mailbox-name"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="staging"
              className={INPUT_CLASS}
              {...form.register("name")}
            />
          </Field>

          {!isEdit ? (
            <Field
              id="mailbox-kind"
              label="Kind"
              hint={kindHint(kind)}
              error={form.formState.errors.kind?.message}
            >
              <ToggleGroup
                type="single"
                value={kind}
                spacing={0}
                variant="outline"
                size="sm"
                className="h-8"
                onValueChange={(v) => {
                  if (!v) return;
                  form.setValue("kind", v as MailboxKind, {
                    shouldValidate: true,
                  });
                }}
              >
                {(["primary", "shared", "ephemeral"] as const).map((k) => (
                  <ToggleGroupItem
                    key={k}
                    value={k}
                    aria-label={KIND_LABEL[k]}
                    className="h-8 gap-1.5 px-2.5 text-[12px]"
                  >
                    <KindDot kind={k} />
                    {KIND_LABEL[k]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field
              id="mailbox-port"
              label="Port"
              hint={portHint({
                isEdit,
                suggested,
                suggestionLoading,
                suggestionError,
                portDirty: form.formState.dirtyFields.port === true,
              })}
              error={form.formState.errors.port?.message}
            >
              <Input
                id="mailbox-port"
                type="number"
                inputMode="numeric"
                min={1}
                max={65535}
                placeholder={
                  suggestionLoading && !isEdit ? "…" : "1025"
                }
                className={`${INPUT_CLASS} tabular-nums`}
                {...form.register("port", { setValueAs: nullableNumberSetter })}
              />
            </Field>

            {kind === "ephemeral" ? (
              <Field
                id="mailbox-ttl"
                label="TTL (seconds)"
                hint="Deletes itself after this."
                error={form.formState.errors.ttlSeconds?.message}
              >
                <Input
                  id="mailbox-ttl"
                  type="number"
                  inputMode="numeric"
                  min={10}
                  placeholder="600"
                  className={`${INPUT_CLASS} tabular-nums`}
                  {...form.register("ttlSeconds", {
                    setValueAs: nullableNumberSetter,
                  })}
                />
              </Field>
            ) : (
              <div className="invisible" />
            )}
          </div>

          {!isEdit ? (
            <label
              htmlFor="mailbox-tls"
              className="flex cursor-pointer items-center justify-between gap-3 py-1"
            >
              <span className="min-w-0">
                <span className="text-foreground text-[13px] font-medium">
                  Implicit TLS
                </span>
                <span className="text-muted-foreground block text-[11.5px] leading-snug">
                  Wraps the socket in TLS before the SMTP banner (port‑465 style).
                </span>
              </span>
              <Switch
                id="mailbox-tls"
                checked={form.watch("implicitTls")}
                onCheckedChange={(v) => form.setValue("implicitTls", v)}
              />
            </label>
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
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PortHintArgs = {
  isEdit: boolean;
  suggested: number | undefined;
  suggestionLoading: boolean;
  suggestionError: unknown;
  portDirty: boolean;
};

/**
 * One-liner under the port field. Reflects the four real states:
 * editing an existing mailbox, suggestion in flight, suggestion
 * accepted but untouched, or the user has typed something.
 */
function portHint({
  isEdit,
  suggested,
  suggestionLoading,
  suggestionError,
  portDirty,
}: PortHintArgs): string {
  if (isEdit) return "Change the port to rebind the listener.";
  if (portDirty) return "Use any free port between 1024 and 65535.";
  if (suggestionLoading) return "Finding a free port…";
  if (suggestionError) return "Couldn't pick one for you. Type a port.";
  if (suggested != null) return `${suggested} is free. Change it if you'd like.`;
  return "Use any free port between 1024 and 65535.";
}

function kindHint(kind: MailboxKind): string {
  if (kind === "primary") return "The default mailbox for this project.";
  if (kind === "shared") return "A named mailbox for shared dev or staging traffic.";
  return "Short-lived. Cleaned up after its TTL.";
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
