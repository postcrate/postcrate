import { useMemo, useState } from "react";
import {
  CaretDownIcon,
  CaretRightIcon,
  ClipboardTextIcon,
  EraserIcon,
  FunnelIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useMailboxes, type Mailbox } from "@/services/mailbox";
import { AUDIT_PAGE_SIZE, useAudit, type AuditEntry } from "@/services/audit";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { actionMeta } from "./components/action-meta";
import { ClearAuditAlert } from "./components/clear-audit-alert";

export default function AuditPage() {
  const [actors, setActors] = useState<Set<string>>(new Set());
  const [actions, setActions] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const {
    entries,
    isLoading,
    isValidating,
    error,
    reachedEnd,
    loadMore,
    refresh,
    reset,
  } = useAudit();
  const { mailboxes } = useMailboxes(null);
  const mailboxById = useMemo(
    () => new Map((mailboxes ?? []).map((m) => [m.id, m] as const)),
    [mailboxes],
  );

  const list = entries ?? [];
  const { actorOptions, actionOptions, filtered } = useMemo(() => {
    const actorSet = new Set<string>();
    const actionSet = new Set<string>();
    for (const e of list) {
      actorSet.add(e.actor);
      actionSet.add(e.action);
    }
    const filtered = list.filter((e) => {
      if (actors.size > 0 && !actors.has(e.actor)) return false;
      if (actions.size > 0 && !actions.has(e.action)) return false;
      return true;
    });
    return {
      actorOptions: Array.from(actorSet).sort(),
      actionOptions: Array.from(actionSet).sort(),
      filtered,
    };
  }, [list, actors, actions]);

  const activeFilterCount = actors.size + actions.size;

  function toggleActor(a: string) {
    setActors((prev) => toggled(prev, a));
  }
  function toggleAction(a: string) {
    setActions((prev) => toggled(prev, a));
  }
  function resetFilters() {
    setActors(new Set());
    setActions(new Set());
  }
  function toggleExpanded(id: number) {
    setExpanded((prev) => toggled(prev, id));
  }

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-6 py-5">
        <PageHeader
          icon={ClipboardTextIcon}
          title="Logs"
          description="Every meaningful action the engine took, in order."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => setClearing(true)}
              disabled={list.length === 0}
              className="gap-2 text-[12.5px]"
            >
              <EraserIcon size={12} weight="regular" />
              Clear log
            </Button>
          }
        />

        {error ? (
          <ErrorBanner
            message={error instanceof Error ? error.message : "Unknown error"}
            onRetry={() => refresh()}
          />
        ) : null}

        {isLoading && entries === undefined ? (
          <TableSkeleton />
        ) : list.length === 0 && !error ? (
          <EmptyAudit />
        ) : (
          <section className="border-border/60 overflow-hidden rounded-xl border">
            <header className="border-border/60 flex h-11 items-center gap-2 border-b px-3">
              <FilterMenu
                actorOptions={actorOptions}
                actionOptions={actionOptions}
                selectedActors={actors}
                selectedActions={actions}
                onToggleActor={toggleActor}
                onToggleAction={toggleAction}
                onReset={resetFilters}
              />
              {activeFilterCount > 0 ? (
                <ActiveFilterChips
                  actors={actors}
                  actions={actions}
                  onClearActor={(a) => toggleActor(a)}
                  onClearAction={(a) => toggleAction(a)}
                />
              ) : null}
              <span className="text-muted-foreground/80 ml-auto text-[11px] tabular-nums">
                {filtered.length} of {list.length}
              </span>
            </header>

            {filtered.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center text-[12.5px]">
                No entries match the current filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <Th className="w-8 pr-0 pl-3" />
                    <Th className="w-44">When</Th>
                    <Th className="w-28">Actor</Th>
                    <Th>Activity</Th>
                    <Th className="w-56">Target</Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <AuditRow
                      key={e.id}
                      entry={e}
                      expanded={expanded.has(e.id)}
                      onToggle={() => toggleExpanded(e.id)}
                      mailboxById={mailboxById}
                    />
                  ))}
                </TableBody>
              </Table>
            )}

            {reachedEnd ? null : (
              <footer className="border-border/60 flex h-11 items-center justify-center gap-2 border-t">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isValidating}
                  className="text-muted-foreground h-7 text-[11.5px]"
                  onClick={loadMore}
                >
                  {isValidating
                    ? "Loading…"
                    : `Load ${AUDIT_PAGE_SIZE} more`}
                </Button>
              </footer>
            )}
          </section>
        )}
      </div>

      <ClearAuditAlert
        open={clearing}
        onOpenChange={setClearing}
        onCleared={() => {
          // Collapse pagination back to page 1 and refetch — the
          // dataset just got wiped, so loaded pages past the first are
          // meaningless.
          setExpanded(new Set());
          void reset();
        }}
      />
    </div>
  );
}

type RowProps = {
  entry: AuditEntry;
  expanded: boolean;
  onToggle: () => void;
  mailboxById: Map<string, Mailbox>;
};

function AuditRow({ entry, expanded, onToggle, mailboxById }: RowProps) {
  const hasMeta = entry.metadata !== null && entry.metadata !== undefined;
  const Caret = expanded ? CaretDownIcon : CaretRightIcon;
  const meta = actionMeta(entry.action);

  return (
    <>
      <TableRow
        onClick={hasMeta ? onToggle : undefined}
        className={cn(hasMeta && "cursor-pointer")}
      >
        <TableCell className="py-2 pr-0 pl-3">
          {hasMeta ? (
            <Caret
              size={11}
              weight="bold"
              className="text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </TableCell>
        <TableCell className="py-2">
          <span
            className="text-foreground block font-mono text-[11.5px] tabular-nums"
            title={new Date(entry.at).toLocaleString()}
          >
            {formatLogTime(entry.at)}
          </span>
        </TableCell>
        <TableCell className="py-2">
          <ActorChip actor={entry.actor} />
        </TableCell>
        <TableCell className="py-2">
          <span className="inline-flex min-w-0 items-center gap-2">
            <meta.Icon
              size={13}
              weight="regular"
              className={cn(
                "shrink-0",
                meta.tone === "destructive" && "text-destructive",
                meta.tone === "warn" && "text-warn",
                meta.tone === "default" && "text-muted-foreground/80",
              )}
              aria-hidden
            />
            <span className="text-foreground truncate text-[12px]">
              {meta.verb}
            </span>
            <span
              className="text-muted-foreground/60 shrink-0 font-mono text-[10.5px]"
              title={entry.action}
            >
              {entry.action}
            </span>
          </span>
        </TableCell>
        <TableCell className="py-2 pr-3">
          {entry.targetKind ? (
            <TargetChip
              kind={entry.targetKind}
              id={entry.targetId}
              mailboxById={mailboxById}
            />
          ) : (
            <span className="text-muted-foreground/40 text-[11px]">—</span>
          )}
        </TableCell>
      </TableRow>
      {hasMeta && expanded ? (
        <TableRow className="hover:bg-transparent">
          <td
            colSpan={5}
            className="bg-muted/20 border-border/60 border-t px-3 py-3"
          >
            <pre className="text-foreground/90 overflow-x-auto font-mono text-[11px] leading-relaxed">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </td>
        </TableRow>
      ) : null}
    </>
  );
}

function ActorChip({ actor }: { actor: string }) {
  const styles =
    actor === "system"
      ? "bg-muted text-muted-foreground"
      : actor === "user"
        ? "bg-info/12 text-info"
        : "bg-brand/12 text-brand";
  return (
    <span
      className={cn(
        styles,
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium tracking-tight",
      )}
    >
      {actor}
    </span>
  );
}

function TargetChip({
  kind,
  id,
  mailboxById,
}: {
  kind: string;
  id: string | null;
  mailboxById: Map<string, Mailbox>;
}) {
  // Resolve mailbox ids to a friendly name + port; other kinds keep
  // their truncated id chip.
  if (kind === "mailbox" && id) {
    const mb = mailboxById.get(id);
    if (mb) {
      return (
        <span
          className={cn(
            "border-border/60 bg-muted/50",
            "inline-flex h-5 max-w-full items-center gap-1 rounded-md border px-1.5 text-[11px]",
          )}
          title={id}
        >
          <span className="text-foreground truncate">{mb.name}</span>
          <span className="text-muted-foreground font-mono">:{mb.port}</span>
        </span>
      );
    }
  }
  return (
    <span
      className={cn(
        "border-border/60 bg-muted/50",
        "inline-flex h-5 max-w-full items-center gap-1 rounded-md border px-1.5 text-[11px]",
      )}
      title={id ?? undefined}
    >
      <span className="text-muted-foreground font-mono">{kind}</span>
      {id ? (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-foreground truncate font-mono">
            {shortenId(id)}
          </span>
        </>
      ) : null}
    </span>
  );
}

function FilterMenu({
  actorOptions,
  actionOptions,
  selectedActors,
  selectedActions,
  onToggleActor,
  onToggleAction,
  onReset,
}: {
  actorOptions: string[];
  actionOptions: string[];
  selectedActors: Set<string>;
  selectedActions: Set<string>;
  onToggleActor: (a: string) => void;
  onToggleAction: (a: string) => void;
  onReset: () => void;
}) {
  const active = selectedActors.size + selectedActions.size;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Filter logs"
              className="relative"
            >
              <FunnelIcon size={14} weight="regular" />
              {active > 0 ? (
                <span
                  aria-hidden
                  className="bg-brand absolute top-1 right-1 size-1.5 rounded-full"
                />
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Filter</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="start"
        className="max-h-[60vh] min-w-52 overflow-y-auto p-1"
      >
        <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
          Actor
        </DropdownMenuLabel>
        {actorOptions.length === 0 ? (
          <div className="text-muted-foreground px-2 py-1 text-[11.5px]">
            No actors yet
          </div>
        ) : (
          actorOptions.map((a) => (
            <DropdownMenuCheckboxItem
              key={a}
              checked={selectedActors.has(a)}
              onCheckedChange={() => onToggleActor(a)}
              onSelect={(e) => e.preventDefault()}
              className="text-[12.5px]"
            >
              {a}
            </DropdownMenuCheckboxItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
          Action
        </DropdownMenuLabel>
        {actionOptions.length === 0 ? (
          <div className="text-muted-foreground px-2 py-1 text-[11.5px]">
            No actions yet
          </div>
        ) : (
          actionOptions.map((a) => (
            <DropdownMenuCheckboxItem
              key={a}
              checked={selectedActions.has(a)}
              onCheckedChange={() => onToggleAction(a)}
              onSelect={(e) => e.preventDefault()}
              className="font-mono text-[11.5px]"
            >
              {a}
            </DropdownMenuCheckboxItem>
          ))
        )}
        {active > 0 ? (
          <>
            <DropdownMenuSeparator />
            <button
              type="button"
              onClick={onReset}
              className="text-muted-foreground hover:bg-muted/60 hover:text-foreground w-full rounded-md px-2 py-1.5 text-left text-[11.5px]"
            >
              Reset filters
            </button>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActiveFilterChips({
  actors,
  actions,
  onClearActor,
  onClearAction,
}: {
  actors: Set<string>;
  actions: Set<string>;
  onClearActor: (a: string) => void;
  onClearAction: (a: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[...actors].map((a) => (
        <FilterChip key={`a-${a}`} label={a} onRemove={() => onClearActor(a)} />
      ))}
      {[...actions].map((a) => (
        <FilterChip
          key={`x-${a}`}
          label={a}
          mono
          onRemove={() => onClearAction(a)}
        />
      ))}
    </div>
  );
}

function FilterChip({
  label,
  mono = false,
  onRemove,
}: {
  label: string;
  mono?: boolean;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        "border-border/60 bg-muted/50 text-foreground hover:bg-muted",
        "inline-flex h-5 items-center gap-1 rounded-md border pr-1 pl-1.5 text-[11px] transition-colors",
        mono && "font-mono",
      )}
      aria-label={`Remove filter ${label}`}
    >
      <span className="truncate">{label}</span>
      <span aria-hidden className="text-muted-foreground/70 text-[10px]">
        ×
      </span>
    </button>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={cn(
        "text-muted-foreground/70 h-9 text-[10.5px] font-medium tracking-wider uppercase",
        className,
      )}
    >
      {children}
    </TableHead>
  );
}

function TableSkeleton() {
  return (
    <section className="border-border/60 overflow-hidden rounded-xl border">
      <div className="border-border/60 h-11 border-b" />
      <div className="border-border/60 bg-muted/10 h-9 border-b" />
      <ul className="divide-border/60 divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 px-3"
            style={{ height: 37 }}
          >
            <span className="bg-muted size-3 shrink-0 rounded" />
            <span className="bg-muted h-3 w-32 rounded tabular-nums" />
            <span className="bg-muted h-4 w-14 rounded-full" />
            <span className="bg-muted h-3 flex-1 rounded" />
            <span className="bg-muted h-4 w-32 rounded-md" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyAudit() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="text-muted-foreground/80">
        <ClipboardTextIcon size={22} weight="regular" />
      </span>
      <h2 className="text-foreground mt-3 text-[14px] font-semibold tracking-tight">
        Nothing logged yet
      </h2>
      <p className="text-muted-foreground mt-1 max-w-xs text-[12.5px] leading-snug">
        Send mail, change settings, or have an MCP agent call a tool. The
        activity shows up here.
      </p>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-xl border px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-destructive text-[12.5px] font-medium">
          Couldn&apos;t load logs
        </div>
        <div className="text-destructive/80 mt-0.5 text-[11.5px] leading-snug">
          {message}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="text-[12px]"
      >
        Retry
      </Button>
    </div>
  );
}

/**
 * "Today 13:45:23" for today, "Feb 12 13:45:23" for this year, and
 * "Feb 12, 2024" for older. Logs need second precision; the row title
 * carries the full locale string for absolute accuracy.
 */
function formatLogTime(at: number): string {
  const d = new Date(at);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const sameYear = d.getFullYear() === now.getFullYear();

  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  if (sameDay) return `Today ${time}`;
  if (sameYear) {
    const date = d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
    });
    return `${date} ${time}`;
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function shortenId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 10)}…` : id;
}

function toggled<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
