/**
 * Email feature module.
 *
 * Mirrors the shape of `services/mailbox.ts`:
 *   - Type re-exports from the generated tauri-specta bindings.
 *   - SWR cache key builders, so query hooks and mutators agree on
 *     the same string shapes.
 *   - Read hooks (`useEmails`, `useEmail`, `useEmailRaw`,
 *     `useEmailSearch`) backed by SWR.
 *   - Write actions: `markEmailRead`, `setEmailStarred`,
 *     `setEmailPinned`, `setEmailTag`, `setEmailNote`, `deleteEmail`,
 *     `releaseEmail`, `replayEmail`, plus bulk variants.
 *   - `useEmailSync` — wires engine `NewEmail` events into optimistic
 *     SWR list prepends and `MailboxStateChanged: deleted` events into
 *     cache eviction.
 *
 * Mutations patch the detail cache + matching list caches synchronously
 * before calling the engine, then revert + rethrow on error so callers
 * can surface their own toasts.
 */

import { useEffect } from "react";
import useSWR, {
  mutate as globalMutate,
  useSWRConfig,
  type SWRConfiguration,
} from "swr";

import { unwrap } from "@/lib/bridge/ipc";
import { useViewStore } from "@/stores/use-view-store";
import { EngineEvent, listenEngine } from "@/lib/bridge/events";
import {
  commands,
  type AttachmentMeta,
  type EmailDetail,
  type EmailSummary,
  type RelayConfig,
} from "@/lib/bridge/bindings";

export type { AttachmentMeta, EmailDetail, EmailSummary, RelayConfig };

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export type EmailSort = "newest" | "oldest";

/** SWR cache keys. Use as readonly tuples — never assemble on the fly. */
export const EMAIL_KEYS = {
  /** Emails for a mailbox, ordered newest- or oldest-first. */
  list: (mailboxId: string, sort: EmailSort = "newest") =>
    ["emails", mailboxId, sort] as const,
  /** Free-text search within a single mailbox. */
  search: (mailboxId: string, query: string) =>
    ["emails-search", mailboxId, query] as const,
  /** Full email by id, including bodies + headers + attachments. */
  detail: (id: string) => ["email", id] as const,
  /** Raw RFC 5322 bytes for an email. Immutable per id. */
  raw: (id: string) => ["email-raw", id] as const,
} as const;

type ListKey = ReturnType<typeof EMAIL_KEYS.list>;
type SearchKey = ReturnType<typeof EMAIL_KEYS.search>;
type DetailKey = ReturnType<typeof EMAIL_KEYS.detail>;
type RawKey = ReturnType<typeof EMAIL_KEYS.raw>;

const DEFAULT_LIMIT = 200;
const DEFAULT_SEARCH_LIMIT = 100;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchEmails(
  mailboxId: string,
  limit: number,
  sort: EmailSort,
): Promise<EmailSummary[]> {
  const rows = unwrap(await commands.listEmails(mailboxId, limit, 0));
  return sort === "oldest" ? [...rows].reverse() : rows;
}

async function fetchEmail(id: string): Promise<EmailDetail> {
  return unwrap(await commands.getEmail(id));
}

async function fetchEmailRaw(id: string): Promise<string> {
  return unwrap(await commands.getEmailRaw(id));
}

async function fetchSearch(
  mailboxId: string,
  query: string,
  limit: number,
): Promise<EmailSummary[]> {
  return unwrap(await commands.searchEmails(query, mailboxId, limit));
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

type UseEmailsResult = {
  emails: EmailSummary[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<EmailSummary[] | undefined>;
};

type UseEmailsOpts = {
  sort?: EmailSort;
  limit?: number;
};

/**
 * Subscribe to the email list for a mailbox. Idle when `mailboxId` is
 * null/undefined (returns `emails: undefined` without fetching).
 *
 * The hook also subscribes directly to the engine's `NewEmail` event
 * for this mailbox and triggers its own bound `mutate()` — that keeps
 * the realtime path on the same cache binding SWR is using for this
 * subscription, no predicate-matching round-trip required.
 */
export function useEmails(
  mailboxId: string | null | undefined,
  opts: UseEmailsOpts = {},
  config?: SWRConfiguration<EmailSummary[]>,
): UseEmailsResult {
  const sort = opts.sort ?? "newest";
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const result = useSWR<EmailSummary[], unknown, ListKey | null>(
    mailboxId ? EMAIL_KEYS.list(mailboxId, sort) : null,
    () => fetchEmails(mailboxId as string, limit, sort),
    config,
  );

  const revalidate = result.mutate;
  useEffect(() => {
    if (!mailboxId) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    listenEngine(EngineEvent.NewEmail, (event) => {
      if (event.payload.kind !== "newEmail") return;
      if (event.payload.mailboxId !== mailboxId) return;
      revalidate();
    }).then((un) => {
      if (cancelled) un();
      else unlisten = un;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [mailboxId, revalidate]);

  return {
    emails: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

type UseEmailResult = {
  email: EmailDetail | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<EmailDetail | undefined>;
};

/**
 * Subscribe to a single email by id. Passing a falsy id leaves the
 * hook idle.
 */
export function useEmail(
  id: string | null | undefined,
  config?: SWRConfiguration<EmailDetail>,
): UseEmailResult {
  const result = useSWR<EmailDetail, unknown, DetailKey | null>(
    id ? EMAIL_KEYS.detail(id) : null,
    () => fetchEmail(id as string),
    config,
  );
  return {
    email: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

type UseEmailRawResult = {
  raw: string | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<string | undefined>;
};

/**
 * Subscribe to the raw RFC 5322 bytes of an email. Marked immutable —
 * no auto-revalidate on focus, no stale revalidation. Pull a fresh
 * copy explicitly via `refresh()` if a mutation alters the underlying
 * blob (currently nothing does).
 */
export function useEmailRaw(
  id: string | null | undefined,
  config?: SWRConfiguration<string>,
): UseEmailRawResult {
  const result = useSWR<string, unknown, RawKey | null>(
    id ? EMAIL_KEYS.raw(id) : null,
    () => fetchEmailRaw(id as string),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      ...config,
    },
  );
  return {
    raw: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

type UseEmailSearchResult = UseEmailsResult;

/**
 * Subscribe to full-text search results for a mailbox. Idle until the
 * trimmed query has at least one character.
 */
export function useEmailSearch(
  mailboxId: string | null | undefined,
  query: string,
  config?: SWRConfiguration<EmailSummary[]>,
): UseEmailSearchResult {
  const trimmed = query.trim();
  const active = !!mailboxId && trimmed.length > 0;
  const result = useSWR<EmailSummary[], unknown, SearchKey | null>(
    active ? EMAIL_KEYS.search(mailboxId as string, trimmed) : null,
    () => fetchSearch(mailboxId as string, trimmed, DEFAULT_SEARCH_LIMIT),
    config,
  );
  return {
    emails: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

// ---------------------------------------------------------------------------
// Mutations (single)
// ---------------------------------------------------------------------------

/**
 * Toggle the read flag on an email. Optimistically patches the detail
 * cache and any matching list caches before calling the engine; reverts
 * + rethrows on failure so the caller can toast.
 */
export async function markEmailRead(
  id: string,
  read: boolean,
): Promise<void> {
  const revert = patchEmailEverywhere(id, (e) => ({ ...e, read }));
  try {
    unwrap(await commands.markRead(id, read));
  } catch (err) {
    await revert();
    throw err;
  }
}

/** Toggle the starred flag on an email. */
export async function setEmailStarred(
  id: string,
  starred: boolean,
): Promise<void> {
  const revert = patchEmailEverywhere(id, (e) => ({ ...e, starred }));
  try {
    unwrap(await commands.setStarred(id, starred));
  } catch (err) {
    await revert();
    throw err;
  }
}

/** Toggle the pinned flag on an email. */
export async function setEmailPinned(
  id: string,
  pinned: boolean,
): Promise<void> {
  const revert = patchEmailEverywhere(id, (e) => ({ ...e, pinned }));
  try {
    unwrap(await commands.setPinned(id, pinned));
  } catch (err) {
    await revert();
    throw err;
  }
}

/** Set or clear an email's freeform tag. */
export async function setEmailTag(
  id: string,
  tag: string | null,
): Promise<void> {
  const revert = patchEmailEverywhere(id, (e) => ({ ...e, tag }));
  try {
    unwrap(await commands.setTag(id, tag));
  } catch (err) {
    await revert();
    throw err;
  }
}

/**
 * Set or clear an email's personal note. The note isn't shown in the
 * list rows, so only the detail cache is patched.
 */
export async function setEmailNote(
  id: string,
  note: string | null,
): Promise<void> {
  const revertDetail = patchDetail(id, (e) => ({ ...e, note }));
  try {
    unwrap(await commands.setNote(id, note));
  } catch (err) {
    await revertDetail();
    throw err;
  }
}

/**
 * Permanently delete an email. Drops the detail + raw cache entries,
 * removes the row from every list cache, and revalidates every cached
 * mailbox detail so the parent count is fresh. The mailbox revalidate
 * is a predicate-match — cheaper than fishing the mailboxId out of an
 * un-typed SWR cache from module scope.
 */
export async function deleteEmail(id: string): Promise<void> {
  unwrap(await commands.deleteEmail(id));
  await Promise.all([
    globalMutate(EMAIL_KEYS.detail(id), undefined, { revalidate: false }),
    globalMutate(EMAIL_KEYS.raw(id), undefined, { revalidate: false }),
    globalMutate(
      (key) =>
        Array.isArray(key) &&
        (key[0] === "emails" || key[0] === "emails-search"),
      (curr?: EmailSummary[]) =>
        curr ? curr.filter((e) => e.id !== id) : curr,
      { revalidate: true },
    ),
    globalMutate(
      (key) => Array.isArray(key) && key[0] === "mailbox",
      undefined,
      { revalidate: true },
    ),
  ]);
}

/** Forward a captured email to an external SMTP relay. */
export async function releaseEmail(
  id: string,
  to: string,
  relay: RelayConfig,
): Promise<void> {
  unwrap(await commands.releaseEmail(id, to, relay));
}

/**
 * Replay an email into another mailbox as if it had just arrived.
 * Invalidates the target mailbox's list so the new row appears.
 */
export async function replayEmail(
  id: string,
  targetMailboxId: string,
): Promise<void> {
  unwrap(await commands.replayEmail(id, targetMailboxId));
  await globalMutate(
    (key) =>
      Array.isArray(key) && key[0] === "emails" && key[1] === targetMailboxId,
    undefined,
    { revalidate: true },
  );
}

// ---------------------------------------------------------------------------
// Mutations (bulk)
// ---------------------------------------------------------------------------

type BulkOutcome = { succeeded: number; failed: number };

/** Mark a batch of emails read or unread. Errors are aggregated. */
export async function markEmailsRead(
  ids: string[],
  read: boolean,
): Promise<BulkOutcome> {
  const results = await Promise.allSettled(
    ids.map((id) => markEmailRead(id, read)),
  );
  return tally(results);
}

/** Delete a batch of emails. */
export async function deleteEmails(ids: string[]): Promise<BulkOutcome> {
  const results = await Promise.allSettled(ids.map((id) => deleteEmail(id)));
  return tally(results);
}

function tally(results: PromiseSettledResult<unknown>[]): BulkOutcome {
  let succeeded = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled") succeeded++;
    else failed++;
  }
  return { succeeded, failed };
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Wire engine cross-cutting concerns into SWR cache eviction. Install
 * once at React root via `<RootLayout />` alongside `useMailboxSync`.
 *
 * NewEmail is handled directly by `useEmails` / `useMailbox` /
 * `useMailboxes` — each hook subscribes to its own slice of the event
 * and calls its bound `mutate()`, which is the safest cache binding
 * we can ask SWR for. This hook only owns the mailbox-deletion
 * cascade: every per-email cache entry belonging to a gone mailbox is
 * evicted and the active selection is cleared if it pointed there.
 */
export function useEmailSync(): void {
  const { cache } = useSWRConfig();

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    listenEngine(EngineEvent.MailboxStateChanged, (event) => {
      if (event.payload.kind !== "mailboxStateChanged") return;
      if (event.payload.change.kind !== "deleted") return;
      const { mailboxId } = event.payload;
      const orphans = collectEmailIdsForMailbox(cache, mailboxId);

      globalMutate(
        (key) =>
          Array.isArray(key) &&
          (key[0] === "emails" || key[0] === "emails-search") &&
          key[1] === mailboxId,
        undefined,
        { revalidate: false },
      );
      for (const id of orphans) {
        globalMutate(EMAIL_KEYS.detail(id), undefined, { revalidate: false });
        globalMutate(EMAIL_KEYS.raw(id), undefined, { revalidate: false });
      }
      if (useViewStore.getState().mailboxId === mailboxId) {
        useViewStore.getState().setMailboxId(null);
      }
    }).then((un) => {
      if (cancelled) un();
      else unlisten = un;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [cache]);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Apply `updater` to the email's detail cache and every list/search
 * cache that contains it. Returns a revert function that revalidates
 * everything affected — call it on failure to restore truth.
 */
function patchEmailEverywhere(
  id: string,
  updater: (e: EmailSummary) => EmailSummary,
): () => Promise<unknown> {
  const detailUpdater = (curr?: EmailDetail) => {
    if (!curr || curr.id !== id) return curr;
    return { ...curr, ...updater(toSummary(curr)) };
  };
  globalMutate(EMAIL_KEYS.detail(id), detailUpdater, { revalidate: false });
  globalMutate(
    (key) =>
      Array.isArray(key) &&
      (key[0] === "emails" || key[0] === "emails-search"),
    (curr?: EmailSummary[]) => {
      if (!curr) return curr;
      let touched = false;
      const next = curr.map((e) => {
        if (e.id !== id) return e;
        touched = true;
        return updater(e);
      });
      return touched ? next : curr;
    },
    { revalidate: false },
  );
  return async () => {
    await Promise.all([
      globalMutate(EMAIL_KEYS.detail(id)),
      globalMutate(
        (key) =>
          Array.isArray(key) &&
          (key[0] === "emails" || key[0] === "emails-search"),
        undefined,
        { revalidate: true },
      ),
    ]);
  };
}

/**
 * Apply `updater` to just the email's detail cache. Returns a revert
 * function that revalidates the detail entry.
 */
function patchDetail(
  id: string,
  updater: (e: EmailDetail) => EmailDetail,
): () => Promise<unknown> {
  globalMutate(
    EMAIL_KEYS.detail(id),
    (curr?: EmailDetail) => (curr ? updater(curr) : curr),
    { revalidate: false },
  );
  return () => globalMutate(EMAIL_KEYS.detail(id));
}

/** Project a detail into the summary subset used by list rows. */
function toSummary(detail: EmailDetail): EmailSummary {
  return {
    id: detail.id,
    mailboxId: detail.mailboxId,
    receivedAt: detail.receivedAt,
    from: detail.from,
    to: detail.to,
    subject: detail.subject,
    hasHtml: detail.hasHtml,
    hasText: detail.hasText,
    sizeBytes: detail.sizeBytes,
    read: detail.read,
    pinned: detail.pinned,
    starred: detail.starred,
    tag: detail.tag,
  };
}

/**
 * Walk the SWR cache for any email-detail entries whose `mailboxId`
 * matches the gone mailbox. Used to evict orphaned per-email caches
 * when a mailbox is deleted.
 */
function collectEmailIdsForMailbox(
  cache: ReturnType<typeof useSWRConfig>["cache"],
  mailboxId: string,
): string[] {
  const ids: string[] = [];
  for (const key of cache.keys()) {
    try {
      const parsed = JSON.parse(key) as unknown;
      if (!Array.isArray(parsed)) continue;
      if (parsed[0] !== "email") continue;
      const entry = cache.get(key);
      const detail = entry?.data as EmailDetail | undefined;
      if (detail?.mailboxId === mailboxId) ids.push(detail.id);
    } catch {
      // Non-JSON keys are not ours — skip.
    }
  }
  return ids;
}
