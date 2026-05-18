import { z } from "zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TonePicker } from "@/components/tone-picker";
import { useOnboardingStore } from "@/stores/use-onboarding-store";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

const INPUT_CLASS = "h-8 text-[12.5px] font-sans placeholder:text-[12.5px]";

const schema = z.object({
  projectName: z
    .string()
    .trim()
    .min(1, "Give your project a name")
    .max(48, "Keep it under 48 characters"),
  smtpPort: z
    .number({ message: "Pick a port" })
    .int("Whole numbers only")
    .min(1, "Port must be ≥ 1")
    .max(65535, "Port must be ≤ 65535"),
  mailboxName: z
    .string()
    .trim()
    .min(1, "Name your default mailbox")
    .max(32, "Keep it under 32 characters")
    .regex(NAME_PATTERN, "Letters, numbers and hyphens only"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  registerSubmit: (handler: (() => Promise<boolean>) | null) => void;
};

export function StepDefaults({ registerSubmit }: Props) {
  const draft = useOnboardingStore((s) => s.draft);
  const patchDraft = useOnboardingStore((s) => s.patchDraft);
  const portInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      projectName: draft.projectName,
      smtpPort: draft.smtpPort,
      mailboxName: draft.mailboxName,
    },
  });

  const { register, handleSubmit, formState, setValue } = form;
  const { ref: portInputRegisterRef, ...portRegister } = register("smtpPort", {
    valueAsNumber: true,
  });

  useEffect(() => {
    const handler = async () => {
      const valid = await form.trigger();
      if (!valid) {
        const first = Object.keys(formState.errors)[0] as
          | keyof FormValues
          | undefined;
        if (first) form.setFocus(first);
        return false;
      }
      const values = form.getValues();
      patchDraft({
        projectName: values.projectName.trim(),
        smtpPort: values.smtpPort,
        mailboxName: values.mailboxName.trim().toLowerCase(),
      });
      return true;
    };
    registerSubmit(handler);
    return () => registerSubmit(null);
  }, [form, formState.errors, patchDraft, registerSubmit]);

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-3.5"
      onSubmit={handleSubmit(() => undefined)}
    >
      <Field
        id="project-name"
        label="Project name"
        hint="Shown in the sidebar. You can rename it later."
        error={formState.errors.projectName?.message}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start" className="pl-4">
            <TonePicker
              value={draft.projectTone}
              onChange={(projectTone) => patchDraft({ projectTone })}
            />
          </InputGroupAddon>
          <InputGroupInput
            id="project-name"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder="Personal"
            className={INPUT_CLASS}
            {...register("projectName", {
              onChange: (e) => setValue("projectName", e.currentTarget.value),
            })}
          />
        </InputGroup>
      </Field>

      <div className="grid grid-cols-[150px_1fr] gap-3">
        <Field
          id="smtp-port"
          label="SMTP port"
          hint="Default: 1025."
          error={formState.errors.smtpPort?.message}
        >
          <Input
            id="smtp-port"
            type="number"
            min={1}
            max={65535}
            inputMode="numeric"
            className={`${INPUT_CLASS} tabular-nums`}
            ref={(el) => {
              portInputRef.current = el;
              portInputRegisterRef(el);
            }}
            {...portRegister}
          />
        </Field>

        <Field
          id="mailbox-name"
          label="Default mailbox"
          hint="Letters and hyphens."
          error={formState.errors.mailboxName?.message}
        >
          <Input
            id="mailbox-name"
            autoComplete="off"
            spellCheck={false}
            placeholder="default"
            className={INPUT_CLASS}
            {...register("mailboxName")}
          />
        </Field>
      </div>
    </form>
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
        className={
          error
            ? "text-destructive text-[11.5px] leading-snug"
            : "text-muted-foreground text-[11.5px] leading-snug"
        }
      >
        {error ?? hint}
      </p>
    </div>
  );
}
