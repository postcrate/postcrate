import { m } from "motion/react";
import { useState, type RefObject } from "react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  SortAscendingIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type EmailSort } from "@/services/email";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ClearInboxButton } from "./clear-inbox-button";

export type FilterKey = "unread" | "starred" | "pinned";

type Props = {
  mailboxId: string;
  query: string;
  onQueryChange: (q: string) => void;
  filters: Set<FilterKey>;
  onToggleFilter: (k: FilterKey) => void;
  sort: EmailSort;
  onSortChange: (s: EmailSort) => void;
  count: number;
  inputRef?: RefObject<HTMLInputElement | null>;
};

const FILTER_LABEL: Record<FilterKey, string> = {
  unread: "Unread",
  starred: "Starred",
  pinned: "Pinned",
};

const SORT_LABEL: Record<EmailSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
};

/**
 * Header for the inbox list: search input on the left, filter and sort
 * dropdowns on the right, with a count chip showing how many emails
 * are currently visible.
 */
export function ListToolbar({
  mailboxId,
  query,
  onQueryChange,
  filters,
  onToggleFilter,
  sort,
  onSortChange,
  count,
  inputRef,
}: Props) {
  return (
    <header className="border-border/60 flex h-11 shrink-0 items-center gap-2 border-b px-3">
      <SearchInput value={query} onChange={onQueryChange} inputRef={inputRef} />

      <span className="bg-muted text-muted-foreground inline-flex h-4 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10.5px] tabular-nums">
        {count}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <FilterMenu filters={filters} onToggle={onToggleFilter} />
        <SortMenu sort={sort} onChange={onSortChange} />
        <ClearInboxButton mailboxId={mailboxId} />
      </div>
    </header>
  );
}

function SearchInput({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const [focused, setFocused] = useState(false);
  const expanded = focused || value.length > 0;

  return (
    <m.div
      animate={{ width: expanded ? 176 : 28 }}
      initial={false}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative h-7 overflow-hidden",
        expanded ? "cursor-text" : "cursor-pointer",
      )}
      onClick={() => {
        if (!expanded) inputRef?.current?.focus();
      }}
    >
      <MagnifyingGlassIcon
        size={12}
        weight="regular"
        className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-2 z-10 -translate-y-1/2"
      />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search messages"
        aria-label="Search messages"
        className={cn(
          "h-7 w-full pr-12 pl-6 text-[12px] placeholder:text-[12px]",
          !expanded &&
            "cursor-pointer border-transparent bg-transparent shadow-none placeholder:opacity-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent",
        )}
      />
      {expanded && value ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange("")}
          className="text-muted-foreground/70 hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5"
          aria-label="Clear search"
        >
          <XIcon size={10} weight="bold" />
        </button>
      ) : expanded ? (
        <kbd
          aria-hidden
          className="bg-muted text-muted-foreground/80 pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 rounded px-1 font-sans text-[10.5px] font-medium tracking-tight"
        >
          /
        </kbd>
      ) : null}
    </m.div>
  );
}

function FilterMenu({
  filters,
  onToggle,
}: {
  filters: Set<FilterKey>;
  onToggle: (k: FilterKey) => void;
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Filter messages"
              className="relative"
            >
              <FunnelIcon size={14} weight="regular" />
              {filters.size > 0 ? (
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
      <DropdownMenuContent align="end" className="min-w-40 p-1">
        <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
          Show only
        </DropdownMenuLabel>
        {(["unread", "starred", "pinned"] as FilterKey[]).map((k) => (
          <DropdownMenuCheckboxItem
            key={k}
            checked={filters.has(k)}
            onCheckedChange={() => onToggle(k)}
            className="text-[12.5px]"
          >
            {FILTER_LABEL[k]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortMenu({
  sort,
  onChange,
}: {
  sort: EmailSort;
  onChange: (s: EmailSort) => void;
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Sort messages">
              <SortAscendingIcon size={14} weight="regular" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Sort</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-40 p-1">
        <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
          Sort by
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["newest", "oldest"] as EmailSort[]).map((k) => (
          <DropdownMenuItem
            key={k}
            onSelect={() => onChange(k)}
            className={cn(
              "text-[12.5px]",
              sort === k && "text-foreground bg-muted",
            )}
          >
            {SORT_LABEL[k]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
