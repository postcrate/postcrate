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

export const VIEW_DESCRIPTIONS: Record<ViewId, string> = {
  inbox: "Inspect mail captured by the local SMTP listener.",
  agent: "Connect AI agents to send and validate mail end-to-end.",
  render: "Preview emails across clients, modes and viewport sizes.",
  mailboxes: "Manage primary, shared and ephemeral mailboxes.",
  scenarios: "Replay recorded mail flows against expected matchers.",
  recordings: "Capture and replay deterministic mail traffic.",
  templates: "Reusable snippets for fixtures and seed data.",
  docs: "API reference, recipes and integration guides.",
};

const VIEW_ICON_BY_ID: Record<ViewId, Icon> = Object.fromEntries(
  NAV_SECTIONS.flatMap((section) => section.items.map((i) => [i.id, i.icon])),
) as Record<ViewId, Icon>;

export function getViewIcon(view: ViewId): Icon {
  return VIEW_ICON_BY_ID[view];
}
