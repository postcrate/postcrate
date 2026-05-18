import { useNavigate } from "react-router-dom";
import {
  CaretDownIcon,
  CheckIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { useViewStore } from "@/stores/use-view-store";
import { getFirstMailboxOfProject } from "@/data/mailboxes";
import {
  findProject,
  useProjectsStore,
  PROJECT_TONE_BG,
  type Project,
} from "@/stores/use-projects-store";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ProjectSwitcher() {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const currentId = useProjectsStore((s) => s.currentId);
  const setCurrentId = useProjectsStore((s) => s.setCurrentId);
  const setMailboxId = useViewStore((s) => s.setMailboxId);

  const current = findProject(projects, currentId);

  if (!current) {
    return (
      <button
        onClick={() => navigate("/mailboxes")}
        className="text-muted-foreground hover:text-foreground flex h-6 items-center gap-1 text-[12px] font-medium"
      >
        <PlusIcon size={11} weight="bold" />
        <span>New project</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-tauri-drag-region="false"
        className={cn(
          "group flex h-6 max-w-full items-center gap-1 rounded-md pr-1 pl-0.5 text-left",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        )}
      >
        <ProjectGlyph project={current} />
        <span className="text-foreground truncate text-[12px] font-medium tracking-tight">
          {current.name}
        </span>
        <CaretDownIcon
          size={9}
          weight="bold"
          className="text-muted-foreground/60 shrink-0"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="min-w-56 p-1"
      >
        <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
          Switch project
        </DropdownMenuLabel>
        {projects.map((p) => {
          const isCurrent = p.id === currentId;
          return (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => {
                setCurrentId(p.id);
                setMailboxId(getFirstMailboxOfProject(p.id).id);
              }}
              className="h-8 gap-2 px-2"
            >
              <ProjectGlyph project={p} />
              <span className="text-foreground flex-1 truncate text-[12.5px]">
                {p.name}
              </span>
              {isCurrent ? (
                <CheckIcon
                  size={12}
                  weight="bold"
                  className="text-brand shrink-0"
                />
              ) : (
                <span className="size-3 shrink-0" aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => navigate("/mailboxes")}
          className="text-muted-foreground h-8 gap-2 px-2 text-[12.5px]"
        >
          <PlusIcon size={12} weight="bold" />
          <span>New project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectGlyph({ project }: { project: Project }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[14px] shrink-0 place-items-center rounded-[3px] text-[8px] font-semibold text-white",
        PROJECT_TONE_BG[project.tone],
      )}
    >
      {project.initial}
    </span>
  );
}
