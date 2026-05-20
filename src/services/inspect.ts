/**
 * Per-email "Inspect" reports.
 *
 * Four read-only reports keyed by email id: spam scoring, link
 * extraction, SPF/DKIM/DMARC predictions, and List-Unsubscribe
 * validation. Each report is an independent SWR cache entry so the
 * detail panel can render them in parallel without blocking on the
 * slowest call.
 *
 * No mutations, no engine event sync — the engine doesn't emit
 * anything when an analysis is re-run (analyses are pure derivations
 * of the captured bytes).
 */

import useSWR, { type SWRConfiguration } from "swr";

import { unwrap } from "@/lib/bridge/ipc";
import {
  commands,
  type AuthReport,
  type LinkReport,
  type SpamReport,
  type UnsubReport,
} from "@/lib/bridge/bindings";

export type { AuthReport, LinkReport, SpamReport, UnsubReport };

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export const INSPECT_KEYS = {
  spam: (emailId: string) => ["inspect", "spam", emailId] as const,
  links: (emailId: string) => ["inspect", "links", emailId] as const,
  auth: (emailId: string) => ["inspect", "auth", emailId] as const,
  unsub: (emailId: string) => ["inspect", "unsub", emailId] as const,
} as const;

type SpamKey = ReturnType<typeof INSPECT_KEYS.spam>;
type LinksKey = ReturnType<typeof INSPECT_KEYS.links>;
type AuthKey = ReturnType<typeof INSPECT_KEYS.auth>;
type UnsubKey = ReturnType<typeof INSPECT_KEYS.unsub>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * Reports cost a few hundred ms each on first call (HTML parse, regex
 * passes). They're deterministic from the captured bytes — no point
 * revalidating on tab focus.
 */
const READ_ONLY_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

type Result<T> = {
  data: T | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<T | undefined>;
};

export function useSpamReport(
  emailId: string | null | undefined,
  config?: SWRConfiguration<SpamReport>,
): Result<SpamReport> {
  const result = useSWR<SpamReport, unknown, SpamKey | null>(
    emailId ? INSPECT_KEYS.spam(emailId) : null,
    async () => unwrap(await commands.spamReport(emailId as string)),
    { ...READ_ONLY_CONFIG, ...config },
  );
  return {
    data: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

export function useLinkReport(
  emailId: string | null | undefined,
  config?: SWRConfiguration<LinkReport>,
): Result<LinkReport> {
  const result = useSWR<LinkReport, unknown, LinksKey | null>(
    emailId ? INSPECT_KEYS.links(emailId) : null,
    async () => unwrap(await commands.linkReport(emailId as string)),
    { ...READ_ONLY_CONFIG, ...config },
  );
  return {
    data: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

export function useAuthReport(
  emailId: string | null | undefined,
  config?: SWRConfiguration<AuthReport>,
): Result<AuthReport> {
  const result = useSWR<AuthReport, unknown, AuthKey | null>(
    emailId ? INSPECT_KEYS.auth(emailId) : null,
    async () => unwrap(await commands.authReport(emailId as string)),
    { ...READ_ONLY_CONFIG, ...config },
  );
  return {
    data: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

export function useUnsubReport(
  emailId: string | null | undefined,
  config?: SWRConfiguration<UnsubReport>,
): Result<UnsubReport> {
  const result = useSWR<UnsubReport, unknown, UnsubKey | null>(
    emailId ? INSPECT_KEYS.unsub(emailId) : null,
    async () => unwrap(await commands.unsubReport(emailId as string)),
    { ...READ_ONLY_CONFIG, ...config },
  );
  return {
    data: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}
