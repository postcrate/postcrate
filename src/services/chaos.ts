/**
 * Chaos-engineering feature module.
 *
 * Chaos config is scoped per mailbox — when enabled, the SMTP listener
 * for that mailbox injects faults (rejection codes, latency, mid-DATA
 * disconnects, malformed responses) so the sender can be tested under
 * realistic failure conditions.
 *
 * Pattern matches `src/services/bounce-rules.ts`:
 *   - Per-mailbox cache key.
 *   - Pure-async mutation that calls `setChaos` and revalidates.
 *   - Sync hook listens for `MailboxStateChanged: deleted` and prunes
 *     stale cache entries.
 */

import type { UnlistenFn } from "@tauri-apps/api/event";

import { useEffect } from "react";
import useSWR, {
  mutate as globalMutate,
  type SWRConfiguration,
} from "swr";

import { unwrap } from "@/lib/bridge/ipc";
import { EngineEvent, listenEngine } from "@/lib/bridge/events";
import { commands, type ChaosConfig } from "@/lib/bridge/bindings";

export type { ChaosConfig };

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export const CHAOS_KEYS = {
  detail: (mailboxId: string) => ["chaos", mailboxId] as const,
} as const;

type DetailKey = ReturnType<typeof CHAOS_KEYS.detail>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * What every chaos slider/toggle reads when the engine has no config
 * persisted yet. Keeping defaults explicit lets `useChaos` always
 * return a populated object even before the first fetch resolves.
 */
export const CHAOS_DEFAULTS: Required<
  Pick<
    ChaosConfig,
    | "enabled"
    | "reject4XxProb"
    | "reject5XxProb"
    | "delayMsMin"
    | "delayMsMax"
    | "dropDuringDataProb"
    | "malformedRespProb"
  >
> = {
  enabled: false,
  reject4XxProb: 0,
  reject5XxProb: 0,
  delayMsMin: 0,
  delayMsMax: 0,
  dropDuringDataProb: 0,
  malformedRespProb: 0,
};

/**
 * True if any fault is non-zero — used to flag the page header and
 * inbox banner. An "enabled" master toggle with all-zero knobs still
 * counts as off for visual purposes.
 */
export function chaosIsActive(cfg: ChaosConfig | undefined): boolean {
  if (!cfg?.enabled) return false;
  return (
    (cfg.reject4XxProb ?? 0) > 0 ||
    (cfg.reject5XxProb ?? 0) > 0 ||
    (cfg.delayMsMax ?? 0) > 0 ||
    (cfg.dropDuringDataProb ?? 0) > 0 ||
    (cfg.malformedRespProb ?? 0) > 0
  );
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchChaos(mailboxId: string): Promise<ChaosConfig> {
  return unwrap(await commands.getChaos(mailboxId));
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

type UseChaosResult = {
  chaos: ChaosConfig | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<ChaosConfig | undefined>;
};

export function useChaos(
  mailboxId: string | null | undefined,
  config?: SWRConfiguration<ChaosConfig>,
): UseChaosResult {
  const result = useSWR<ChaosConfig, unknown, DetailKey | null>(
    mailboxId ? CHAOS_KEYS.detail(mailboxId) : null,
    () => fetchChaos(mailboxId as string),
    config,
  );

  return {
    chaos: result.data,
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
 * Replace the chaos config for a mailbox. The optimistic patch lands
 * before the IPC so sliders feel snappy; on failure the cache reverts
 * by force-revalidating against the engine.
 */
export async function setChaos(
  mailboxId: string,
  cfg: ChaosConfig,
): Promise<void> {
  await globalMutate(CHAOS_KEYS.detail(mailboxId), cfg, { revalidate: false });
  try {
    unwrap(await commands.setChaos(mailboxId, cfg));
  } catch (err) {
    await globalMutate(CHAOS_KEYS.detail(mailboxId));
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Drop cached chaos entries when a mailbox is deleted. There's no
 * chaos-specific event, so we ride the mailbox lifecycle.
 */
export function useChaosSync(): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listenEngine(EngineEvent.MailboxStateChanged, (event) => {
      if (event.payload.kind !== "mailboxStateChanged") return;
      if (event.payload.change.kind !== "deleted") return;
      globalMutate(
        (key) => Array.isArray(key) && key[0] === "chaos",
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
