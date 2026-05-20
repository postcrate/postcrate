import type { Icon } from "@phosphor-icons/react";

import {
  TrayIcon,
  PackageIcon,
  FlaskIcon,
} from "@phosphor-icons/react/dist/ssr";

export type ViewId = "inbox" | "mailboxes" | "scenarios";

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
      { id: "mailboxes", label: "Mailboxes", icon: PackageIcon },
      { id: "scenarios", label: "Scenarios", icon: FlaskIcon, dot: "warn" },
    ],
  },
];

export const VIEW_TITLES: Record<ViewId, string> = {
  inbox: "Inbox",
  mailboxes: "Mailboxes",
  scenarios: "Scenarios",
};

export const VIEW_SUBTITLES: Partial<Record<ViewId, string>> = {
  mailboxes: "5 active",
  scenarios: "0 saved",
};

const VIEW_IDS = new Set<ViewId>(["inbox", "mailboxes", "scenarios"]);

export function pathnameToViewId(pathname: string): ViewId {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  return VIEW_IDS.has(seg as ViewId) ? (seg as ViewId) : "inbox";
}

export function viewIdToPath(viewId: ViewId): string {
  return `/${viewId}`;
}
