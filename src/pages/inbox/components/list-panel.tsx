import { useEffect, useMemo, useRef, useState } from "react";

import { reportIpcError } from "@/lib/bridge/ipc";
import { useViewStore } from "@/stores/use-view-store";
import {
  deleteEmail,
  markEmailRead,
  setEmailPinned,
  setEmailStarred,
  useEmails,
  useEmailSearch,
  type EmailSort,
  type EmailSummary,
} from "@/services/email";

import { EmailRow } from "./email-row";
import { ListBulkBar } from "./list-bulk-bar";
import { ListSkeleton } from "./list-skeleton";
import { ListToolbar, type FilterKey } from "./list-toolbar";

type Props = {
  mailboxId: string;
};

const SEARCH_DEBOUNCE_MS = 200;

/**
 * Left pane of the inbox: shows the email list for the current mailbox.
 * Selection is held in `useViewStore.emailId` so it persists across
 * mailbox switches via the store's cascade-clear logic.
 */
export function ListPanel({ mailboxId }: Props) {
  const emailId = useViewStore((s) => s.emailId);
  const setEmailId = useViewStore((s) => s.setEmailId);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const [sort, setSort] = useState<EmailSort>("newest");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedQuery(query),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(t);
  }, [query]);

  // Drop checks for emails that have left the visible set (mailbox
  // switch, filter change, delete).
  useEffect(() => {
    setChecked(new Set());
  }, [mailboxId]);

  const browse = useEmails(mailboxId, { sort });
  const search = useEmailSearch(mailboxId, debouncedQuery);
  const searching = debouncedQuery.trim().length > 0;

  const source = searching ? search : browse;
  const all = source.emails ?? [];
  const visible = useMemo(
    () => applyFilters(all, filters),
    [all, filters],
  );

  const checkedEmails = useMemo(
    () => visible.filter((e) => checked.has(e.id)),
    [visible, checked],
  );

  function toggleFilter(k: FilterKey) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function toggleChecked(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Scroll the active row into view whenever selection changes via
  // either click or j/k navigation.
  useEffect(() => {
    if (!emailId) return;
    const node = scrollRef.current?.querySelector<HTMLElement>(
      `[data-email-id="${CSS.escape(emailId)}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [emailId, visible]);

  // Page-scoped keyboard shortcuts. Skip when typing into a field so
  // the binds never steal "delete" from a textarea or "/" from search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        // Inside an input: only Escape gets a special meaning (blur +
        // clear search), and only when it's our search input.
        if (e.key === "Escape" && target === searchInputRef.current) {
          if (query.length > 0) {
            e.preventDefault();
            setQuery("");
          } else {
            target.blur();
          }
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const ids = visible.map((v) => v.id);
      const currentIdx = emailId ? ids.indexOf(emailId) : -1;
      const selected =
        emailId != null ? visible.find((v) => v.id === emailId) : null;

      switch (e.key) {
        case "j":
        case "ArrowDown": {
          if (ids.length === 0) return;
          e.preventDefault();
          const next = currentIdx < 0 ? 0 : Math.min(currentIdx + 1, ids.length - 1);
          setEmailId(ids[next]);
          return;
        }
        case "k":
        case "ArrowUp": {
          if (ids.length === 0) return;
          e.preventDefault();
          const next = currentIdx <= 0 ? 0 : currentIdx - 1;
          setEmailId(ids[next]);
          return;
        }
        case "e": {
          if (!selected) return;
          e.preventDefault();
          markEmailRead(selected.id, !selected.read).catch((err) =>
            reportIpcError(err, "Couldn't toggle read"),
          );
          return;
        }
        case "s": {
          if (!selected) return;
          e.preventDefault();
          setEmailStarred(selected.id, !selected.starred).catch((err) =>
            reportIpcError(err, "Couldn't toggle star"),
          );
          return;
        }
        case "p": {
          if (!selected) return;
          e.preventDefault();
          setEmailPinned(selected.id, !selected.pinned).catch((err) =>
            reportIpcError(err, "Couldn't toggle pin"),
          );
          return;
        }
        case "Backspace":
        case "Delete": {
          if (!selected) return;
          e.preventDefault();
          deleteEmail(selected.id)
            .then(() => setEmailId(null))
            .catch((err) => reportIpcError(err, "Couldn't delete"));
          return;
        }
        case "/": {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
          return;
        }
        case "Escape": {
          if (emailId) {
            e.preventDefault();
            setEmailId(null);
          }
          return;
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, emailId, query, setEmailId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onToggleFilter={toggleFilter}
        sort={sort}
        onSortChange={setSort}
        count={visible.length}
        inputRef={searchInputRef}
      />
      <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto">
        <ListBody
          isLoading={source.isLoading && !source.emails}
          error={source.error}
          searching={searching}
          query={debouncedQuery}
          visible={visible}
          activeId={emailId}
          checked={checked}
          onSelect={setEmailId}
          onToggleChecked={toggleChecked}
        />
      </div>
      {checkedEmails.length > 0 ? (
        <ListBulkBar
          selected={checkedEmails}
          onClear={() => setChecked(new Set())}
        />
      ) : null}
    </div>
  );
}

function ListBody({
  isLoading,
  error,
  searching,
  query,
  visible,
  activeId,
  checked,
  onSelect,
  onToggleChecked,
}: {
  isLoading: boolean;
  error: unknown;
  searching: boolean;
  query: string;
  visible: EmailSummary[];
  activeId: string | null;
  checked: Set<string>;
  onSelect: (id: string) => void;
  onToggleChecked: (id: string) => void;
}) {
  if (isLoading) return <ListSkeleton />;

  if (error) {
    return (
      <p className="text-destructive flex flex-1 items-center justify-center px-6 text-center text-[12.5px]">
        {error instanceof Error ? error.message : "Couldn't load messages"}
      </p>
    );
  }

  if (visible.length === 0) {
    return (
      <p className="text-muted-foreground flex flex-1 items-center justify-center px-6 text-center text-[12.5px]">
        {searching
          ? `No messages match "${query}".`
          : "No messages match the active filter."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {visible.map((email) => (
        <li key={email.id}>
          <EmailRow
            email={email}
            selected={email.id === activeId}
            checked={checked.has(email.id)}
            onSelect={() => onSelect(email.id)}
            onToggleChecked={() => onToggleChecked(email.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function applyFilters(
  emails: EmailSummary[],
  filters: Set<FilterKey>,
): EmailSummary[] {
  if (filters.size === 0) return emails;
  return emails.filter((e) => {
    if (filters.has("unread") && e.read) return false;
    if (filters.has("starred") && !e.starred) return false;
    if (filters.has("pinned") && !e.pinned) return false;
    return true;
  });
}
