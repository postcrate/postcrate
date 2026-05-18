import { toast } from "sonner";
import { useMemo, useState } from "react";
import {
  EraserIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SortAscendingIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import { Checkbox } from "@/components/ui/checkbox";
import { useViewStore } from "@/stores/use-view-store";
import {
  clearMailbox,
  deleteMailbox,
  type Mailbox,
} from "@/services/mailbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

import { KIND_LABEL } from "./kind";
import { MailboxRow } from "./mailbox-row";

type SortKey = "name" | "port" | "count" | "createdAt";
type KindFilter = "primary" | "shared" | "ephemeral";

type Props = {
  mailboxes: Mailbox[];
  onEdit: (mailbox: Mailbox) => void;
  onDelete: (mailbox: Mailbox) => void;
};

export function MailboxTable({ mailboxes, onEdit, onDelete }: Props) {
  const activeId = useViewStore((s) => s.mailboxId);
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [filters, setFilters] = useState<Set<KindFilter>>(new Set());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = mailboxes.filter((m) => {
      if (filters.size > 0 && !filters.has(m.kind)) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => compare(a, b, sortBy));
  }, [mailboxes, sortBy, filters, query]);

  const visibleIds = useMemo(() => visible.map((m) => m.id), [visible]);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = visibleIds.some((id) => selected.has(id));
  const headerChecked: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  function toggleFilter(kind: KindFilter) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (visibleIds.every((id) => prev.has(id))) {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of visibleIds) next.add(id);
      return next;
    });
  }

  const selectedMailboxes = useMemo(
    () => mailboxes.filter((m) => selected.has(m.id)),
    [mailboxes, selected],
  );

  async function bulkClear() {
    let totalCleared = 0;
    const results = await Promise.allSettled(
      selectedMailboxes.map((m) => clearMailbox(m.id)),
    );
    for (const r of results) {
      if (r.status === "fulfilled") totalCleared += r.value;
      else reportIpcError(r.reason, "A mailbox failed to clear");
    }
    toast.success(
      totalCleared === 0
        ? "Mailboxes already empty"
        : `Cleared ${totalCleared} message${totalCleared === 1 ? "" : "s"}`,
    );
    setSelected(new Set());
  }

  async function bulkDelete() {
    const results = await Promise.allSettled(
      selectedMailboxes.map((m) => deleteMailbox(m.id)),
    );
    let succeeded = 0;
    for (const r of results) {
      if (r.status === "fulfilled") succeeded++;
      else reportIpcError(r.reason, "A mailbox failed to delete");
    }
    if (succeeded > 0) {
      toast.success(
        `Deleted ${succeeded} mailbox${succeeded === 1 ? "" : "es"}`,
      );
    }
    setSelected(new Set());
  }

  return (
    <section className="border-border/60 overflow-hidden rounded-xl border">
      <header className="border-border/60 flex h-11 items-center gap-3 border-b px-3">
        <SearchInput value={query} onChange={setQuery} />

        <div className="ml-auto flex items-center gap-1">
          <FilterMenu filters={filters} onToggle={toggleFilter} />
          <SortMenu sortBy={sortBy} onChange={setSortBy} />
        </div>
      </header>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <Th className="w-8 pr-0 pl-3">
              <Checkbox
                checked={headerChecked}
                onCheckedChange={toggleAll}
                aria-label={
                  allSelected ? "Deselect all mailboxes" : "Select all mailboxes"
                }
              />
            </Th>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>SMTP</Th>
            <Th>Kind</Th>
            <Th>Linked test</Th>
            <Th className="text-right">Mail</Th>
            <Th>TTL</Th>
            <Th>Last seen</Th>
            <Th className="w-6" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((mailbox) => (
            <MailboxRow
              key={mailbox.id}
              mailbox={mailbox}
              selected={selected.has(mailbox.id)}
              active={mailbox.id === activeId}
              onToggleSelected={() => toggleRow(mailbox.id)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {visible.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <td
                colSpan={10}
                className="text-muted-foreground py-10 text-center text-[12.5px]"
              >
                {query
                  ? `No mailboxes matching "${query}".`
                  : "No mailboxes match the active filter."}
              </td>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      {selectedMailboxes.length > 0 ? (
        <BulkBar
          count={selectedMailboxes.length}
          onClear={bulkClear}
          onDelete={bulkDelete}
          onDeselect={() => setSelected(new Set())}
        />
      ) : null}
    </section>
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

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative w-44">
      <MagnifyingGlassIcon
        size={12}
        weight="regular"
        className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="Filter by name"
        className="h-7 pr-6 pl-6 text-[12px] placeholder:text-[12px]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-muted-foreground/70 hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5"
          aria-label="Clear search"
        >
          <XIcon size={10} weight="bold" />
        </button>
      ) : null}
    </div>
  );
}

function FilterMenu({
  filters,
  onToggle,
}: {
  filters: Set<KindFilter>;
  onToggle: (k: KindFilter) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2 text-[12px]">
          <FunnelIcon size={12} weight="regular" />
          Filter
          {filters.size > 0 ? (
            <span className="bg-foreground/10 text-foreground ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded px-1 font-mono text-[10.5px] tabular-nums">
              {filters.size}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40 p-1">
        <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
          Kind
        </DropdownMenuLabel>
        {(["primary", "shared", "ephemeral"] as const).map((k) => (
          <DropdownMenuCheckboxItem
            key={k}
            checked={filters.has(k)}
            onCheckedChange={() => onToggle(k)}
            className="text-[12.5px]"
          >
            {KIND_LABEL[k]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SORT_LABEL: Record<SortKey, string> = {
  name: "Name",
  port: "Port",
  count: "Mail count",
  createdAt: "Created",
};

function SortMenu({
  sortBy,
  onChange,
}: {
  sortBy: SortKey;
  onChange: (k: SortKey) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2 text-[12px]">
          <SortAscendingIcon size={12} weight="regular" />
          Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40 p-1">
        <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
          Sort by
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
          <DropdownMenuItem
            key={k}
            onSelect={() => onChange(k)}
            className={cn(
              "text-[12.5px]",
              sortBy === k && "text-foreground bg-muted",
            )}
          >
            {SORT_LABEL[k]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BulkBar({
  count,
  onClear,
  onDelete,
  onDeselect,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onDeselect: () => void;
}) {
  return (
    <div className="border-border/60 bg-muted/40 flex h-11 items-center gap-2 border-t px-3">
      <span className="text-foreground text-[12.5px] font-medium">
        {count} selected
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={onClear}
        className="text-[12px]"
      >
        <EraserIcon size={12} weight="regular" />
        Clear mail
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onDelete}
        className="text-destructive hover:text-destructive text-[12px]"
      >
        <TrashIcon size={12} weight="regular" />
        Delete
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDeselect}
        className="ml-auto text-[12px]"
      >
        Deselect
      </Button>
    </div>
  );
}

function compare(a: Mailbox, b: Mailbox, by: SortKey): number {
  switch (by) {
    case "name":
      return a.name.localeCompare(b.name);
    case "port":
      return a.port - b.port;
    case "count":
      return b.count - a.count;
    case "createdAt":
      return b.createdAt - a.createdAt;
  }
}
