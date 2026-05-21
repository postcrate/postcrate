import { z } from "zod";
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
    .number({ message: "Must be a number" })
    .int("Whole numbers only")
    .min(min, `Must be ≥ ${min}`)
    .max(max, `Must be ≤ ${max}`)
    .nullable();

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Give your mailbox a name")
      .max(48, "Keep it under 48 characters")
      .regex(NAME_PATTERN, "Letters, numbers and hyphens only"),
    kind: z.enum(["primary", "shared", "ephemeral"] as const),
    port: optionalNumber(1, 65535),
    ttlSeconds: optionalNumber(10, 86400 * 30),
    implicitTls: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (
      values.kind === "ephemeral" &&
      (values.ttlSeconds == null || values.ttlSeconds <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ttlSeconds"],
        message: "Ephemeral mailboxes need a TTL",
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
  const {
    port: suggested,
    isLoading: suggestionLoading,
    error: suggestionError,
    refresh: refreshSuggested,
  } = useSuggestedPort();

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
          throw new Error("Pick a project before creating a mailbox");
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
    ? "Rename, repoint, or extend the TTL of this mailbox."
    : "Add a mailbox to capture SMTP traffic on a port. Ephemerals are TTL-bounded and auto-cleaned.";
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
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3.5"
        >
          <Field
            id="mailbox-name"
            label="Name"
            hint="Letters, numbers and hyphens."
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
                hint="Auto-deletes after this."
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
                  Wrap the socket in TLS before the SMTP banner (port‑465 style).
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
  if (portDirty) return "Use any free port 1024–65535.";
  if (suggestionLoading) return "Finding a free port…";
  if (suggestionError) return "Couldn't auto-suggest — type a port.";
  if (suggested != null) return `Suggested ${suggested} — change if you'd like.`;
  return "Use any free port 1024–65535.";
}

function kindHint(kind: MailboxKind): string {
  if (kind === "primary") return "The default mailbox for this project.";
  if (kind === "shared") return "A named mailbox for shared dev/staging traffic.";
  return "Short-lived mailbox; cleaned up after its TTL.";
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
