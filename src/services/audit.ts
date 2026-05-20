/**
 * Audit-log feature module.
 *
 * The engine appends to an audit table for every meaningful operation
 * (mailbox CRUD, settings change, MCP tool invocation, …). The UI
 * exposes it as a read-mostly log with one destructive action
 * (`clearAudit`).
 *
 * Pagination strategy — `useSWRInfinite`:
 *   - One cache key per page (`["audit", PAGE_SIZE, pageIndex * PAGE_SIZE]`).
 *   - "Load older entries" just calls `setSize(size + 1)`; previous
 *     pages stay cached, so the array grows in-place. The render is
 *     append-only, which means no scroll-position reset and no
 *     re-fetch of pages the user has already seen.
 *   - `useAuditSync` listens to `AuditAppended` and prepends new
 *     entries to the first page only — that's where the freshest
 *     entries live.
 */

import type { UnlistenFn } from "@tauri-apps/api/event";

import { useEffect, useMemo } from "react";
import { mutate as globalMutate } from "swr";
import useSWRInfinite, {
  type SWRInfiniteConfiguration,
} from "swr/infinite";

import { unwrap } from "@/lib/bridge/ipc";
import { EngineEvent, listenEngine } from "@/lib/bridge/events";
import { commands, type AuditEntry } from "@/lib/bridge/bindings";

export type { AuditEntry };

export const AUDIT_PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export const AUDIT_KEYS = {
  page: (offset: number, limit = AUDIT_PAGE_SIZE) =>
    ["audit", limit, offset] as const,
} as const;

type PageKey = ReturnType<typeof AUDIT_KEYS.page>;

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetchAuditPage(key: PageKey): Promise<AuditEntry[]> {
  const [, limit, offset] = key;
  return unwrap(await commands.listAudit(limit, offset));
}

// ---------------------------------------------------------------------------
// Query hook
// ---------------------------------------------------------------------------

type UseAuditResult = {
  /** Flat, in-order list of entries across all loaded pages. */
  entries: AuditEntry[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  /** True once the latest page returned fewer items than `pageSize`. */
  reachedEnd: boolean;
  /** Number of pages currently in cache. */
  pageCount: number;
  /** Load one more page worth of older entries. */
  loadMore: () => void;
  /** Force-revalidate every loaded page. */
  refresh: () => Promise<AuditEntry[][] | undefined>;
  /**
   * Collapse pagination back to a single first page and refetch.
   * Use after a destructive op (e.g. clearAudit) wipes the underlying
   * dataset and "page 2" no longer makes sense.
   */
  reset: () => Promise<AuditEntry[][] | undefined>;
};

/**
 * Subscribe to a growing window of audit entries. Pages are independent
 * cache entries so "Load more" appends without disturbing what's
 * already on screen (no scroll-to-top, no re-fetch of older pages).
 */
export function useAudit(
  config?: SWRInfiniteConfiguration<AuditEntry[]>,
): UseAuditResult {
  const swr = useSWRInfinite<AuditEntry[], unknown>(
    (pageIndex, previousPageData) => {
      // Stop generating keys once a page came back partial — there's
      // nothing older to fetch.
      if (previousPageData && previousPageData.length < AUDIT_PAGE_SIZE) {
        return null;
      }
      return AUDIT_KEYS.page(pageIndex * AUDIT_PAGE_SIZE);
    },
    fetchAuditPage,
    {
      revalidateFirstPage: false,
      ...config,
    },
  );

  const entries = useMemo(() => {
    if (!swr.data) return undefined;
    return swr.data.flat();
  }, [swr.data]);

  const lastPage = swr.data?.[swr.data.length - 1];
  const reachedEnd =
    lastPage !== undefined && lastPage.length < AUDIT_PAGE_SIZE;

  return {
    entries,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    error: swr.error,
    reachedEnd,
    pageCount: swr.size,
    loadMore: () => swr.setSize(swr.size + 1),
    refresh: () => swr.mutate(),
    reset: async () => {
      await swr.setSize(1);
      return swr.mutate();
    },
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Remove audit entries. `olderThanDays === null` clears everything;
 * a positive integer keeps the recent window. Returns the deleted
 * count so callers can show a toast.
 *
 * Callers are responsible for refreshing the list view — typically by
 * invoking `useAudit().reset()` from the page that triggered the
 * clear. We deliberately don't `globalMutate` here because the
 * `useSWRInfinite` aggregator state is owned by a hook instance and
 * predicate-matching its internal key isn't reliable.
 */
export async function clearAudit(olderThanDays: number | null): Promise<number> {
  return unwrap(await commands.clearAudit(olderThanDays));
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Prepend new audit entries to the *first* page so the section reflects
 * activity live without polling. Older pages don't need updating —
 * they're frozen historical windows.
 */
export function useAuditSync(): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listenEngine(EngineEvent.AuditAppended, (event) => {
      if (event.payload.kind !== "auditAppended") return;
      const entry = event.payload.entry;
      globalMutate(
        AUDIT_KEYS.page(0),
        (prev: AuditEntry[] | undefined) =>
          prev ? [entry, ...prev].slice(0, AUDIT_PAGE_SIZE) : prev,
        { revalidate: false },
      );
    }).then((un) => {
      if (cancelled) un();
      else unlisten = un;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
