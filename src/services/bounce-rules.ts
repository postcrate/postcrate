/**
 * Bounce-rule feature module.
 *
 * Bounce rules are scoped per mailbox on the engine side
 * (`listBounceRules(mailboxId)`), so the cache key carries the mailbox
 * id. Mutations invalidate the matching key only — siblings stay warm.
 *
 * `useBounceRuleSync` revalidates *every* bounce-rule key when a
 * mailbox is deleted, so any stale list belonging to the gone mailbox
 * gets dropped on next subscriber.
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
  type BounceKind,
  type BounceRule,
} from "@/lib/bridge/bindings";

export type { BounceKind, BounceRule };

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export const BOUNCE_KEYS = {
  list: (mailboxId: string) => ["bounce-rules", mailboxId] as const,
} as const;

type ListKey = ReturnType<typeof BOUNCE_KEYS.list>;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchBounceRules(mailboxId: string): Promise<BounceRule[]> {
  return unwrap(await commands.listBounceRules(mailboxId));
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

type UseBounceRulesResult = {
  rules: BounceRule[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<BounceRule[] | undefined>;
};

/**
 * Bounce rules for one mailbox. Passing a falsy id leaves the hook
 * idle so accordion items that haven't been opened don't fire a fetch.
 */
export function useBounceRules(
  mailboxId: string | null | undefined,
  config?: SWRConfiguration<BounceRule[]>,
): UseBounceRulesResult {
  const result = useSWR<BounceRule[], unknown, ListKey | null>(
    mailboxId ? BOUNCE_KEYS.list(mailboxId) : null,
    () => fetchBounceRules(mailboxId as string),
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

/**
 * Create or update a bounce rule. The engine command is upsert by id,
 * so we surface a single mutation for both flows.
 */
export async function upsertBounceRule(rule: BounceRule): Promise<BounceRule> {
  const saved = unwrap(await commands.upsertBounceRule(rule));
  await globalMutate(BOUNCE_KEYS.list(rule.mailboxId));
  return saved;
}

export async function deleteBounceRule(
  id: string,
  mailboxId: string,
): Promise<void> {
  unwrap(await commands.deleteBounceRule(id));
  await globalMutate(BOUNCE_KEYS.list(mailboxId));
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Drop every cached bounce-rule list when a mailbox is deleted. Cheaper
 * than tracking the specific id; SWR's dedupe makes the cost flat.
 */
export function useBounceRuleSync(): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listenEngine(EngineEvent.MailboxStateChanged, (event) => {
      if (event.payload.kind !== "mailboxStateChanged") return;
      if (event.payload.change.kind !== "deleted") return;
      globalMutate(
        (key) => Array.isArray(key) && key[0] === "bounce-rules",
        undefined,
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
