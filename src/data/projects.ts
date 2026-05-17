export type ProjectTone = "brand" | "info" | "success" | "warn" | "danger";

export type Project = {
  id: string;
  name: string;
  initial: string;
  tone: ProjectTone;
};

export const PROJECTS: Project[] = [
  { id: "personal", name: "Personal", initial: "P", tone: "brand" },
  { id: "acme", name: "Acme", initial: "A", tone: "info" },
  { id: "side", name: "Side hustle", initial: "S", tone: "success" },
];

export const DEFAULT_PROJECT_ID = PROJECTS[0].id;

export const PROJECT_TONE_BG: Record<ProjectTone, string> = {
  brand: "bg-brand",
  info: "bg-info",
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
};

export function findProject(id: string): Project {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
}
