import { useState } from "react";
import {
  ArrowsClockwiseIcon,
  BellIcon,
  GearIcon,
  GlobeIcon,
  PaintBrushIcon,
  RobotIcon,
  ShieldIcon,
  TrayIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

import { InboxSection } from "./components/sections/inbox";
import { AgentsSection } from "./components/sections/agents";
import { GeneralSection } from "./components/sections/general";
import { NetworkSection } from "./components/sections/network";
import { PrivacySection } from "./components/sections/privacy";
import { UpdatesSection } from "./components/sections/updates";
import { AdvancedSection } from "./components/sections/advanced";
import { AppearanceSection } from "./components/sections/appearance";
import { NotificationsSection } from "./components/sections/notifications";

const SECTIONS = [
  { id: "appearance", label: "Appearance", Icon: PaintBrushIcon },
  { id: "general", label: "General", Icon: GearIcon },
  { id: "notifications", label: "Notifications", Icon: BellIcon },
  { id: "inbox", label: "Inbox", Icon: TrayIcon },
  { id: "network", label: "Network & Listeners", Icon: GlobeIcon },
  { id: "agents", label: "AI & Agents", Icon: RobotIcon },
  { id: "privacy", label: "Privacy", Icon: ShieldIcon },
  { id: "updates", label: "Updates", Icon: ArrowsClockwiseIcon },
  { id: "advanced", label: "Advanced", Icon: WrenchIcon },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const SECTION_COMPONENTS: Record<SectionId, () => React.ReactElement> = {
  appearance: AppearanceSection,
  general: GeneralSection,
  notifications: NotificationsSection,
  inbox: InboxSection,
  network: NetworkSection,
  agents: AgentsSection,
  privacy: PrivacySection,
  updates: UpdatesSection,
  advanced: AdvancedSection,
};

export default function PreferencesPage() {
  const [active, setActive] = useState<SectionId>("appearance");
  const ActiveSection = SECTION_COMPONENTS[active];

  return (
    <div className="text-foreground flex h-screen">
      <aside className="border-sidebar-border bg-sidebar/55 text-sidebar-foreground flex w-56 shrink-0 flex-col border-r">
        <div data-tauri-drag-region className="h-10 shrink-0" />
        <nav className="flex-1 space-y-px overflow-y-auto px-2 pt-1">
          {SECTIONS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "flex h-7 w-full items-center gap-2.5 rounded-md pr-2 pl-2.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-[15px] shrink-0",
                    isActive ? "opacity-100" : "opacity-85",
                  )}
                  weight={isActive ? "fill" : "regular"}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="bg-background relative flex-1 overflow-auto overscroll-none">
        <div data-tauri-drag-region className="sticky top-0 z-10 h-10 shrink-0" />
        <div className="mx-auto -mt-10 max-w-2xl px-7 pt-12 pb-10">
          <ActiveSection />
        </div>
      </main>
    </div>
  );
}
