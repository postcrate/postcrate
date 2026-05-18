/**
 * Mailbox feature module.
 *
 * All mailbox-related plumbing lives here:
 *   - Type re-exports from the generated tauri-specta bindings.
 *   - SWR cache key builders, so query hooks and mutators agree on
 *     the same string shapes.
 *   - Read hooks (`useMailboxes`, `useMailbox`) backed by SWR.
 *   - Write actions (`createMailbox`, `updateMailbox`, `deleteMailbox`,
 *     `createEphemeralMailbox`, `clearMailbox`, `purgeMailbox`).
 *   - `installMailboxSync` — boot-time listener that turns engine
 *     `MailboxStateChanged` events into SWR cache invalidations so the
 *     UI reacts to backend-driven changes (ephemeral expiry, listener
 *     started/stopped, etc.) without the user having to refresh.
 *
 * The action functions invalidate the SWR cache via the global
 * `mutate`, so any component reading the same key re-fetches without
 * extra wiring at the call site.
 */

import useSWR, { mutate as globalMutate, type SWRConfiguration } from "swr";

import { unwrap } from "@/lib/bridge/ipc";
import { EngineEvent, listenEngine } from "@/lib/bridge/events";
import {
  commands,
  type CreateEphemeralInput,
  type CreateMailboxInput,
  type EphemeralHandle,
  type Mailbox,
  type MailboxKind,
  type UpdateMailboxInput,
} from "@/lib/bridge/bindings";

export type {
  CreateEphemeralInput,
  CreateMailboxInput,
  EphemeralHandle,
  Mailbox,
  MailboxKind,
  UpdateMailboxInput,
};

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

/** SWR cache keys. Use as readonly tuples — never assemble on the fly. */
export const MAILBOX_KEYS = {
  /** All mailboxes, optionally scoped to a project. */
  list: (projectId: string | null = null) =>
    ["mailboxes", projectId] as const,
  /** A single mailbox by id. */
  detail: (id: string) => ["mailbox", id] as const,
} as const;

type ListKey = ReturnType<typeof MAILBOX_KEYS.list>;
type DetailKey = ReturnType<typeof MAILBOX_KEYS.detail>;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchMailboxes(projectId: string | null): Promise<Mailbox[]> {
  return unwrap(await commands.listMailboxes(projectId));
}

async function fetchMailbox(id: string): Promise<Mailbox> {
  return unwrap(await commands.getMailbox(id));
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

type UseMailboxesResult = {
  mailboxes: Mailbox[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<Mailbox[] | undefined>;
};

/**
 * Subscribe to the mailbox list, optionally scoped to a project.
 * Passing `undefined` / `null` returns mailboxes across all projects.
 */
export function useMailboxes(
  projectId?: string | null,
  config?: SWRConfiguration<Mailbox[]>,
): UseMailboxesResult {
  const scoped = projectId ?? null;
  const result = useSWR<Mailbox[], unknown, ListKey>(
    MAILBOX_KEYS.list(scoped),
    () => fetchMailboxes(scoped),
    config,
  );
  return {
    mailboxes: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

type UseMailboxResult = {
  mailbox: Mailbox | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<Mailbox | undefined>;
};

/**
 * Subscribe to a single mailbox by id. Passing a falsy id leaves the
 * hook idle (returns `undefined` for `mailbox` without fetching).
 */
export function useMailbox(
  id: string | null | undefined,
  config?: SWRConfiguration<Mailbox>,
): UseMailboxResult {
  const result = useSWR<Mailbox, unknown, DetailKey | null>(
    id ? MAILBOX_KEYS.detail(id) : null,
    () => fetchMailbox(id as string),
    config,
  );
  return {
    mailbox: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

// ---------------------------------------------------------------------------
// Mutations (actions)
// ---------------------------------------------------------------------------

/**
 * Create a persistent mailbox. The new mailbox is written into the
 * detail cache directly so the next `useMailbox(id)` lookup is hot,
 * and every list query is invalidated.
 */
export async function createMailbox(
  input: CreateMailboxInput,
): Promise<Mailbox> {
  const mailbox = unwrap(await commands.createMailbox(input));
  await Promise.all([
    globalMutate(MAILBOX_KEYS.detail(mailbox.id), mailbox, {
      revalidate: false,
    }),
    invalidateLists(),
  ]);
  return mailbox;
}

/**
 * Patch a mailbox (name, port, ttl, …). Writes the fresh value into
 * the detail cache without a re-fetch, then invalidates lists.
 */
export async function updateMailbox(
  id: string,
  patch: UpdateMailboxInput,
): Promise<Mailbox> {
  const mailbox = unwrap(await commands.updateMailbox(id, patch));
  await Promise.all([
    globalMutate(MAILBOX_KEYS.detail(id), mailbox, { revalidate: false }),
    invalidateLists(),
  ]);
  return mailbox;
}

/**
 * Permanently remove a mailbox. The cached detail entry is dropped
 * so any UI currently rendering it can react.
 */
export async function deleteMailbox(id: string): Promise<void> {
  unwrap(await commands.deleteMailbox(id));
  await Promise.all([
    globalMutate(MAILBOX_KEYS.detail(id), undefined, { revalidate: false }),
    invalidateLists(),
  ]);
}

/**
 * Create a TTL-bounded ephemeral mailbox. Returns the engine handle
 * (`{ id, host, port, expiresAt }`) so the caller can show the bound
 * endpoint right away.
 */
export async function createEphemeralMailbox(
  input: CreateEphemeralInput,
): Promise<EphemeralHandle> {
  const handle = unwrap(await commands.createEphemeral(input));
  await invalidateLists();
  return handle;
}

/**
 * Remove all captured email from a mailbox without destroying it.
 * Returns the number of deleted rows.
 */
export async function clearMailbox(mailboxId: string): Promise<number> {
  const count = unwrap(await commands.clearMailbox(mailboxId));
  await globalMutate(MAILBOX_KEYS.detail(mailboxId));
  return count;
}

/**
 * Destroy every email + attachment on disk for a mailbox. Stronger
 * than `clearMailbox`: triggers a vacuum of the underlying blob store.
 * Returns the number of deleted rows.
 */
export async function purgeMailbox(mailboxId: string): Promise<number> {
  const count = unwrap(await commands.purgeMailbox(mailboxId));
  await globalMutate(MAILBOX_KEYS.detail(mailboxId));
  return count;
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Wire engine `MailboxStateChanged` events into SWR cache invalidation
 * so the UI reacts to backend-driven mailbox lifecycle (created /
 * started / stopped / expired / failed / deleted) without needing
 * per-component listeners.
 *
 * Returns the unsubscribe handle — call at app boot, dispose on
 * teardown (e.g. logout / app-quit).
 */
export async function installMailboxSync(): Promise<() => void> {
  const unlisten = await listenEngine(
    EngineEvent.MailboxStateChanged,
    (event) => {
      if (event.payload.kind !== "mailboxStateChanged") return;
      const { mailboxId, change } = event.payload;

      if (change.kind === "deleted") {
        // Drop the detail cache entry outright — there's nothing to
        // refetch.
        globalMutate(MAILBOX_KEYS.detail(mailboxId), undefined, {
          revalidate: false,
        });
      } else {
        // Anything else (created / updated / started / stopped /
        // expired / failed) means the stored shape changed.
        globalMutate(MAILBOX_KEYS.detail(mailboxId));
      }

      invalidateLists();
    },
  );
  return unlisten;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Invalidate every cached mailbox list, regardless of project filter.
 * Cheaper than tracking which list a mutation belongs to, and SWR's
 * dedupe + revalidation keep the network cost flat.
 */
function invalidateLists(): Promise<unknown> {
  return globalMutate(
    (key) => Array.isArray(key) && key[0] === "mailboxes",
    undefined,
    { revalidate: true },
  );
}
