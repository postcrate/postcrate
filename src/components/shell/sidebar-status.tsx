import { GearIcon } from "@phosphor-icons/react/dist/ssr";

import { MAILBOXES } from "@/data/mailboxes";
import { PulseDot } from "@/components/pulse-dot";
import { openPreferencesWindow } from "@/lib/windows";
import { useViewStore } from "@/stores/use-view-store";

import { IconButton } from "./icon-button";

export function SidebarStatus() {
  const mailboxId = useViewStore((s) => s.mailboxId);
  const current = MAILBOXES.find((m) => m.id === mailboxId) ?? MAILBOXES[0];

  return (
    <div className="border-sidebar-border mt-auto flex h-10 shrink-0 items-center gap-2 border-t px-3">
      <PulseDot tone="success" />
      <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
        :{current.port}
      </span>
      <span className="text-muted-foreground/70 text-[11px]">Listening</span>
      <div className="flex-1" />
      <IconButton
        size="sm"
        title="Preferences"
        icon={GearIcon}
        onClick={openPreferencesWindow}
      />
    </div>
  );
}
