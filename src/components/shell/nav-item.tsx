import type { NavItem as Item } from "@/data/nav-items";

import { cn } from "@/lib/utils";
import { PulseDot } from "@/components/pulse-dot";

type Props = {
  item: Item;
  active: boolean;
  onClick: () => void;
};

export function NavItem({ item, active, onClick }: Props) {
  const { label, icon: IconComp, badge, dot } = item;

  return (
    <button
      onClick={onClick}
      data-active={active || undefined}
      className={cn(
        "group relative flex h-7 w-full items-center gap-2.5 rounded-md pr-2 pl-2.5",
        "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground",
        "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "bg-brand pointer-events-none absolute top-1/2 -left-1 h-3.5 w-[2px] -translate-y-1/2 rounded-r-sm transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <IconComp
        size={15}
        weight={active ? "fill" : "regular"}
        className={cn("shrink-0", active ? "opacity-100" : "opacity-85")}
      />
      <span className="min-w-0 flex-1 truncate text-left text-[13px]">
        {label}
      </span>
      {badge ? (
        <span className="text-muted-foreground/70 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 font-mono text-[10.5px] tabular-nums">
          {badge}
        </span>
      ) : null}
      {!badge && dot ? <PulseDot tone={dot} className="mr-px" /> : null}
    </button>
  );
}
