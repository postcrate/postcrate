import { GearIcon, PlayIcon, StopIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { MAILBOXES } from "@/data/mailboxes";
import { openPreferencesWindow } from "@/lib/windows";
import { IconButton } from "@/components/icon-button";
import { useViewStore } from "@/stores/use-view-store";
import { useServerStore } from "@/stores/use-server-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarStatus() {
  const mailboxId = useViewStore((s) => s.mailboxId);
  const current = MAILBOXES.find((m) => m.id === mailboxId) ?? MAILBOXES[0];
  const running = useServerStore((s) => s.running);
  const toggle = useServerStore((s) => s.toggle);

  const ToggleIcon = running ? StopIcon : PlayIcon;
  const toggleLabel = running ? "Stop listener" : "Start listener";

  return (
    <div className="border-sidebar-border mt-auto flex h-10 shrink-0 items-center gap-1.5 border-t pr-2 pl-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={toggleLabel}
            onClick={toggle}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md transition-colors",
              "focus-visible:ring-ring/30 outline-none focus-visible:ring-2",
              running
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "text-brand bg-brand/12 hover:bg-brand/20",
            )}
          >
            <ToggleIcon size={12} weight="fill" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{toggleLabel}</TooltipContent>
      </Tooltip>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="text-foreground/85 font-mono text-[11px] tabular-nums">
          :{current.port}
        </span>
        <span
          aria-hidden
          className="bg-border/80 h-2.5 w-px shrink-0"
        />
        {running ? (
          <span
            aria-hidden
            className="bg-success motion-safe:animate-[pulse-soft_1.8s_ease-in-out_infinite] size-1.5 shrink-0 rounded-full shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_22%,transparent)]"
          />
        ) : null}
        <span
          className={cn(
            "truncate text-[11px]",
            running ? "text-foreground/70" : "text-muted-foreground/60",
          )}
        >
          {running ? "Listening" : "Stopped"}
        </span>
      </div>

      <IconButton
        size="sm"
        title="Preferences"
        icon={GearIcon}
        onClick={openPreferencesWindow}
      />
    </div>
  );
}
