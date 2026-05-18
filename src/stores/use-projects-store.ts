import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProjectTone = "brand" | "info" | "success" | "warn" | "danger";

export type Project = {
  id: string;
  name: string;
  initial: string;
  tone: ProjectTone;
};

export const PROJECT_TONE_BG: Record<ProjectTone, string> = {
  brand: "bg-brand",
  info: "bg-info",
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
};

const TONE_CYCLE: ProjectTone[] = ["brand", "info", "success", "warn", "danger"];

type ProjectsState = {
  projects: Project[];
  currentId: string | null;
  setCurrentId: (id: string) => void;
  addProject: (input: { name: string }) => Project;
  removeProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
};

function makeId(name: string, existing: ReadonlyArray<Project>): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const base = slug || "project";
  let id = base;
  let i = 2;
  while (existing.some((p) => p.id === id)) {
    id = `${base}-${i++}`;
  }
  return id;
}

function nextTone(projects: ReadonlyArray<Project>): ProjectTone {
  return TONE_CYCLE[projects.length % TONE_CYCLE.length];
}

function initial(name: string): string {
  const ch = name.trim().charAt(0);
  return (ch || "?").toUpperCase();
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentId: null,
      setCurrentId: (id) => {
        if (get().projects.some((p) => p.id === id)) set({ currentId: id });
      },
      addProject: ({ name }) => {
        const trimmed = name.trim();
        const projects = get().projects;
        const project: Project = {
          id: makeId(trimmed, projects),
          name: trimmed,
          initial: initial(trimmed),
          tone: nextTone(projects),
        };
        set({
          projects: [...projects, project],
          currentId: get().currentId ?? project.id,
        });
        return project;
      },
      removeProject: (id) => {
        const projects = get().projects.filter((p) => p.id !== id);
        const currentId = get().currentId === id ? (projects[0]?.id ?? null) : get().currentId;
        set({ projects, currentId });
      },
      renameProject: (id, name) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name: name.trim(), initial: initial(name) } : p,
          ),
        })),
    }),
    { name: "postcrate-projects" },
  ),
);

export function findProject(
  projects: ReadonlyArray<Project>,
  id: string | null,
): Project | null {
  if (!id) return null;
  return projects.find((p) => p.id === id) ?? null;
}
