import { z } from "zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { suggestName } from "@/lib/suggest";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TonePicker } from "@/components/tone-picker";
import { useViewStore } from "@/stores/use-view-store";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  PROJECT_TONES,
  useProjectsStore,
  type Project,
  type ProjectTone,
} from "@/stores/use-projects-store";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";

const NAME_INPUT_CLASS =
  "h-8 text-[12.5px] font-sans placeholder:text-[12.5px]";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give your project a name")
    .max(48, "Keep it under 48 characters"),
});

type FormValues = z.infer<typeof schema>;

type CreateProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create";
  project?: never;
  defaultTone?: ProjectTone;
  onCreated?: (projectId: string) => void;
};

type EditProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "edit";
  project: Project;
  defaultTone?: never;
  onCreated?: never;
};

type Props = CreateProps | EditProps;

/**
 * One dialog, two modes: create a new project, or edit an existing
 * one's name and tone. Keeping them unified means the layout, sizing
 * and validation stay in lockstep.
 */
export function ProjectFormDialog(props: Props) {
  const { open, onOpenChange } = props;
  const isEdit = props.mode === "edit";

  const projects = useProjectsStore((s) => s.projects);
  const addProject = useProjectsStore((s) => s.addProject);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const setCurrentId = useProjectsStore((s) => s.setCurrentId);
  const setMailboxId = useViewStore((s) => s.setMailboxId);

  const initialTone = isEdit
    ? props.project.tone
    : (props.defaultTone ??
      PROJECT_TONES[projects.length % PROJECT_TONES.length]);

  const [tone, setTone] = useState<ProjectTone>(initialTone);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: { name: isEdit ? props.project.name : "" },
  });

  // Each open of the dialog reseeds the form so stale state from a
  // previous session never leaks through. Create mode gets a fresh
  // suggested name every time so users can submit on Enter.
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.reset({ name: props.project.name });
    } else {
      form.reset({ name: suggestName() });
    }
    setTone(initialTone);

  }, [open, isEdit, initialTone, isEdit ? props.project.id : null, form]);

  function onSubmit(values: FormValues) {
    if (isEdit) {
      updateProject(props.project.id, { name: values.name, tone });
      onOpenChange(false);
      return;
    }
    const project = addProject({ name: values.name, tone });
    setCurrentId(project.id);
    // No mailbox to focus yet for a brand-new project — the sidebar
    // switcher will surface "No mailbox yet" until one is created.
    setMailboxId(null);
    props.onCreated?.(project.id);
    onOpenChange(false);
  }

  const title = isEdit ? "Edit project" : "New project";
  const description = isEdit
    ? "Update the project's name and color."
    : "Organize mailboxes under a project. You can rename or change the color anytime.";
  const submitLabel = isEdit ? "Save changes" : "Create project";
  const placeholder = isEdit ? props.project.name : "Acme";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-1.5"
        >
          <Label
            htmlFor="project-form-name"
            className="text-[13px] font-medium"
          >
            Name
          </Label>
          <InputGroup>
            <InputGroupAddon align="inline-start" className="pl-4">
              <TonePicker value={tone} onChange={setTone} />
            </InputGroupAddon>
            <InputGroupInput
              id="project-form-name"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder={placeholder}
              className={NAME_INPUT_CLASS}
              {...form.register("name")}
            />
          </InputGroup>
          <p
            className={cn(
              "text-[11.5px] leading-snug",
              form.formState.errors.name
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {form.formState.errors.name?.message ?? "Shown in the sidebar."}
          </p>

          <DialogFooter className="mt-5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
