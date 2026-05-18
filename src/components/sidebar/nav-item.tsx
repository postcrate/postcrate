import useSWR from "swr";
import { NavLink } from "react-router-dom";

import type { NavItem as Item } from "@/data/nav-items";

import { cn } from "@/lib/utils";
import { viewIdToPath } from "@/data/nav-items";
import { PulseDot } from "@/components/pulse-dot";
import { useProjectsStore } from "@/stores/use-projects-store";
import { MAILBOX_KEYS, type Mailbox } from "@/services/mailbox";

type Props = {
  item: Item;
};

export function NavItem({ item }: Props) {
  const { label, icon: IconComp, dot } = item;
  const dynamicBadge = useDynamicBadge(item);
  const badge = dynamicBadge ?? item.badge;

  return (
    <NavLink
      to={viewIdToPath(item.id)}
      className={({ isActive }) =>
        cn(
          "group relative flex h-7 w-full items-center gap-2.5 rounded-md pr-2 pl-2.5",
          "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          isActive &&
            "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden
            className={cn(
              "bg-brand pointer-events-none absolute top-1/2 -left-1 h-3.5 w-[2px] -translate-y-1/2 rounded-r-sm transition-opacity",
              isActive ? "opacity-100" : "opacity-0",
            )}
          />
          <IconComp
            size={15}
            weight={isActive ? "fill" : "regular"}
            className={cn("shrink-0", isActive ? "opacity-100" : "opacity-85")}
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
        </>
      )}
    </NavLink>
  );
}

/**
 * Some nav entries surface real counts (mailbox count for "mailboxes").
 * We subscribe to the SWR cache *without* a fetcher — the sidebar's
 * MailboxSwitcher (and the Mailboxes page) keep that key fresh, so the
 * badge piggybacks on their fetch instead of issuing its own.
 */
function useDynamicBadge(item: Item): string | undefined {
  const projectId = useProjectsStore((s) => s.currentId);
  const isMailboxes = item.id === "mailboxes";

  const { data } = useSWR<Mailbox[]>(
    isMailboxes ? MAILBOX_KEYS.list(projectId ?? null) : null,
    null,
    { revalidateOnFocus: false },
  );

  if (!isMailboxes) return undefined;
  return data && data.length > 0 ? String(data.length) : undefined;
}
