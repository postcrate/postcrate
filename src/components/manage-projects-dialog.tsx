import { useState } from "react";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import {
  useProjectsStore,
  PROJECT_TONE_BG,
  type Project,
} from "@/stores/use-projects-store";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ManageProjectsDialog({ open, onOpenChange }: Props) {
  const projects = useProjectsStore((s) => s.projects);
  const currentId = useProjectsStore((s) => s.currentId);
  const removeProject = useProjectsStore((s) => s.removeProject);

  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const isLast = projects.length <= 1;

  function confirmDelete() {
    if (!pendingDelete) return;
    removeProject(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage projects</DialogTitle>
            <DialogDescription>
              Remove projects you no longer need. Deleted projects can't
              be recovered.
            </DialogDescription>
          </DialogHeader>

          {projects.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-[12px]">
              No projects yet.
            </p>
          ) : (
            <ul className="divide-border/60 border-border/60 divide-y overflow-hidden rounded-lg border">
              {projects.map((project) => {
                const disabled = isLast;
                return (
                  <li
                    key={project.id}
                    className="flex items-center gap-2.5 px-3 py-2"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-[4px] text-[9px] font-semibold text-white",
                        PROJECT_TONE_BG[project.tone],
                      )}
                    >
                      {project.initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground truncate text-[12.5px] font-medium">
                        {project.name}
                      </div>
                      {project.id === currentId ? (
                        <div className="text-muted-foreground/80 text-[11px] leading-tight">
                          Current
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit project ${project.name}`}
                        title={`Edit ${project.name}`}
                        onClick={() => setEditing(project)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <PencilSimpleIcon size={13} weight="regular" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete project ${project.name}`}
                        disabled={disabled}
                        title={
                          disabled
                            ? "At least one project is required"
                            : `Delete ${project.name}`
                        }
                        onClick={() => setPendingDelete(project)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon size={14} weight="regular" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editing ? (
        <ProjectFormDialog
          mode="edit"
          project={editing}
          open={editing !== null}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      ) : null}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <>
                  <span className="text-foreground font-medium">
                    {pendingDelete.name}
                  </span>{" "}
                  will be removed. Its mailboxes stay on disk and can be
                  re-imported.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete{pendingDelete ? ` ${shortName(pendingDelete.name)}` : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function shortName(name: string): string {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}
