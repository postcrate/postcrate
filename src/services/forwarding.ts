/**
 * Forwarding-rules feature module.
 *
 * Mirrors `src/services/webhooks.ts`:
 *   - One cache key (the list).
 *   - SWR query hook + pure-async mutation helpers.
 *   - `useForwardingSync` revalidates when a mailbox is deleted so
 *     scope chips re-resolve (`Unknown mailbox`).
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
  type CreateForwardingRule,
  type ForwardingRule,
  type RelayConfig,
} from "@/lib/bridge/bindings";

export type { CreateForwardingRule, ForwardingRule, RelayConfig };

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export const FORWARDING_KEYS = {
  list: () => ["forwarding-rules"] as const,
} as const;

type ListKey = ReturnType<typeof FORWARDING_KEYS.list>;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchForwardingRules(): Promise<ForwardingRule[]> {
  return unwrap(await commands.listForwardingRules());
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

type UseForwardingResult = {
  rules: ForwardingRule[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<ForwardingRule[] | undefined>;
};

export function useForwarding(
  config?: SWRConfiguration<ForwardingRule[]>,
): UseForwardingResult {
  const result = useSWR<ForwardingRule[], unknown, ListKey>(
    FORWARDING_KEYS.list(),
    fetchForwardingRules,
    config,
  );

  return {
    rules: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createForwardingRule(
  input: CreateForwardingRule,
): Promise<ForwardingRule> {
  const created = unwrap(await commands.createForwardingRule(input));
  await globalMutate(FORWARDING_KEYS.list());
  return created;
}

export async function deleteForwardingRule(id: string): Promise<void> {
  unwrap(await commands.deleteForwardingRule(id));
  await globalMutate(FORWARDING_KEYS.list());
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Revalidate the list when a mailbox is deleted. The engine orphans the
 * scope reference but keeps the rule alive; the UI needs to refresh to
 * render the orphan state.
 */
export function useForwardingSync(): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listenEngine(EngineEvent.MailboxStateChanged, (event) => {
      if (event.payload.kind !== "mailboxStateChanged") return;
      if (event.payload.change.kind !== "deleted") return;
      globalMutate(FORWARDING_KEYS.list());
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
