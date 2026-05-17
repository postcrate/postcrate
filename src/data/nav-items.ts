import type { Icon } from "@phosphor-icons/react";

import {
  TrayIcon,
  RobotIcon,
  BrowsersIcon,
  PackageIcon,
  FlaskIcon,
  RecordIcon,
  FilesIcon,
  BookOpenIcon,
} from "@phosphor-icons/react/dist/ssr";

export type ViewId =
  | "inbox"
  | "agent"
  | "render"
  | "mailboxes"
  | "scenarios"
  | "recordings"
  | "templates"
  | "docs";

type Tone = "success" | "warn" | "danger" | "info";

export type NavItem = {
  id: ViewId;
  label: string;
  icon: Icon;
  badge?: string;
  dot?: Tone;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "navigate",
    label: "Navigate",
    items: [
      { id: "inbox", label: "Inbox", icon: TrayIcon },
      { id: "agent", label: "AI Agent", icon: RobotIcon, dot: "success" },
      { id: "render", label: "Render", icon: BrowsersIcon },
      { id: "mailboxes", label: "All mailboxes", icon: PackageIcon, badge: "5" },
      { id: "scenarios", label: "Scenarios", icon: FlaskIcon, dot: "warn" },
    ],
  },
  {
    id: "library",
    label: "Library",
    items: [
      { id: "recordings", label: "Recordings", icon: RecordIcon, badge: "4" },
      { id: "templates", label: "Templates", icon: FilesIcon, badge: "12" },
      { id: "docs", label: "Docs", icon: BookOpenIcon },
    ],
  },
];

export const VIEW_TITLES: Record<ViewId, string> = {
  inbox: "Inbox",
  agent: "AI Agent",
  render: "Render preview",
  mailboxes: "Mailboxes",
  scenarios: "Scenarios",
  recordings: "Recordings",
  templates: "Templates",
  docs: "Docs",
};

export const VIEW_SUBTITLES: Partial<Record<ViewId, string>> = {
  agent: "Idle",
  render: "All clients",
  mailboxes: "5 active",
  scenarios: "0 saved",
  recordings: "4 captures",
  templates: "12 templates",
};

const VIEW_IDS = new Set<ViewId>([
  "inbox",
  "agent",
  "render",
  "mailboxes",
  "scenarios",
  "recordings",
  "templates",
  "docs",
]);

export function pathnameToViewId(pathname: string): ViewId {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  return VIEW_IDS.has(seg as ViewId) ? (seg as ViewId) : "inbox";
}

export function viewIdToPath(viewId: ViewId): string {
  return `/${viewId}`;
}
