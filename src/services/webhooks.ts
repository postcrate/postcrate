/**
 * Webhook feature module.
 *
 * Same shape as `src/services/mailbox.ts`:
 *   - Cache key builder so query hook + mutators agree.
 *   - Read hook (`useWebhooks`) backed by SWR.
 *   - Mutation actions (`createWebhook`, `deleteWebhook`) that call the
 *     engine and revalidate.
 *   - `useWebhookSync` — boot-time listener that invalidates the list
 *     when a mailbox is deleted, so the "Scope: <mailbox>" chip on
 *     existing rows is forced to re-resolve.
 *
 * The engine doesn't emit a dedicated webhook lifecycle event yet, so
 * the only out-of-band invalidation is the cascade from
 * `MailboxStateChanged: deleted`.
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
  type CreateWebhook,
  type Webhook,
} from "@/lib/bridge/bindings";

export type { CreateWebhook, Webhook };

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export const WEBHOOK_KEYS = {
  list: () => ["webhooks"] as const,
} as const;

type ListKey = ReturnType<typeof WEBHOOK_KEYS.list>;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchWebhooks(): Promise<Webhook[]> {
  return unwrap(await commands.listWebhooks());
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

type UseWebhooksResult = {
  webhooks: Webhook[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<Webhook[] | undefined>;
};

export function useWebhooks(
  config?: SWRConfiguration<Webhook[]>,
): UseWebhooksResult {
  const result = useSWR<Webhook[], unknown, ListKey>(
    WEBHOOK_KEYS.list(),
    fetchWebhooks,
    config,
  );

  return {
    webhooks: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createWebhook(input: CreateWebhook): Promise<Webhook> {
  const created = unwrap(await commands.createWebhook(input));
  await globalMutate(WEBHOOK_KEYS.list());
  return created;
}

export async function deleteWebhook(id: string): Promise<void> {
  unwrap(await commands.deleteWebhook(id));
  await globalMutate(WEBHOOK_KEYS.list());
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Revalidate the webhook list when a mailbox is deleted. The engine
 * orphans the scope reference (`mailboxId`) but doesn't touch the
 * webhook row itself, so the UI needs to refresh to render the orphan
 * state ("Unknown mailbox" chip).
 */
export function useWebhookSync(): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listenEngine(EngineEvent.MailboxStateChanged, (event) => {
      if (event.payload.kind !== "mailboxStateChanged") return;
      if (event.payload.change.kind !== "deleted") return;
      globalMutate(WEBHOOK_KEYS.list());
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
