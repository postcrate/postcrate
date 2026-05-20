/**
 * Audit-log feature module.
 *
 * The engine appends to an audit table for every meaningful operation
 * (mailbox CRUD, settings change, MCP tool invocation, …). The UI
 * exposes it as a read-mostly log with one destructive action
 * (`clearAudit`).
 *
 * Cache strategy:
 *   - One key per `(limit, offset)` window — but in practice the
 *     section keeps `offset=0` and grows `limit` ("load more"), so
 *     there's effectively one live key.
 *   - `useAuditSync` listens to `AuditAppended` and prepends the new
 *     entry to *every* cached window so the log feels live without a
 *     refetch.
 */

import type { UnlistenFn } from "@tauri-apps/api/event";

import { useEffect } from "react";
import useSWR, {
  mutate as globalMutate,
  type SWRConfiguration,
} from "swr";

import { unwrap } from "@/lib/bridge/ipc";
import { EngineEvent, listenEngine } from "@/lib/bridge/events";
import {
  commands,
  type AuditEntry,
} from "@/lib/bridge/bindings";

export type { AuditEntry };

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export const AUDIT_KEYS = {
  list: (limit = 200, offset = 0) => ["audit", limit, offset] as const,
} as const;

type ListKey = ReturnType<typeof AUDIT_KEYS.list>;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchAudit(
  limit: number,
  offset: number,
): Promise<AuditEntry[]> {
  return unwrap(await commands.listAudit(limit, offset));
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

type UseAuditResult = {
  entries: AuditEntry[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<AuditEntry[] | undefined>;
};

export function useAudit(
  limit: number = 200,
  offset: number = 0,
  config?: SWRConfiguration<AuditEntry[]>,
): UseAuditResult {
  const result = useSWR<AuditEntry[], unknown, ListKey>(
    AUDIT_KEYS.list(limit, offset),
    () => fetchAudit(limit, offset),
    config,
  );

  return {
    entries: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Remove audit entries. `olderThanDays === null` clears everything;
 * a positive integer keeps the recent window.
 */
export async function clearAudit(olderThanDays: number | null): Promise<number> {
  const deleted = unwrap(await commands.clearAudit(olderThanDays));
  await globalMutate(
    (key) => Array.isArray(key) && key[0] === "audit",
    undefined,
    { revalidate: true },
  );
  return deleted;
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Prepend new audit entries to every cached window so the section
 * reflects activity live without polling. Install once at React root.
 */
export function useAuditSync(): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listenEngine(EngineEvent.AuditAppended, (event) => {
      if (event.payload.kind !== "auditAppended") return;
      const entry = event.payload.entry;
      globalMutate(
        (key) => Array.isArray(key) && key[0] === "audit",
        (prev: AuditEntry[] | undefined) =>
          prev ? [entry, ...prev] : prev,
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
