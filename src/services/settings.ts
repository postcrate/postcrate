/**
 * Backend settings feature module.
 *
 * Mirrors `src/services/mailbox.ts` so every engine-backed surface
 * looks the same:
 *   - Type re-exports from the generated tauri-specta bindings.
 *   - One SWR key — settings is a single document; per-section
 *     invalidation isn't worth the complexity since the fetch is one
 *     IPC.
 *   - Read hook (`useBackendSettings`) backed by SWR.
 *   - Optimistic write actions (`updateNetworkPrefs`,
 *     `updateAgentPrefs`, `updateInboxPrefs`, `updateAdvancedPrefs`).
 *   - `useSettingsSync` — boot-time listener that turns engine
 *     `SettingsChanged` events into a cache revalidate so external
 *     mutations (CLI, MCP, another window) are reflected here.
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
  type AdvancedPrefs,
  type AgentPrefs,
  type BackendSettings,
  type InboxPrefs,
  type NetworkPrefs,
} from "@/lib/bridge/bindings";

export type {
  AdvancedPrefs,
  AgentPrefs,
  BackendSettings,
  InboxPrefs,
  NetworkPrefs,
};

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

/**
 * Settings is a single document on the engine side. One key keeps every
 * consumer in lock-step and avoids the foot-gun of partial caches that
 * disagree about which section is fresh.
 */
export const SETTINGS_KEYS = {
  all: () => ["settings"] as const,
} as const;

type AllKey = ReturnType<typeof SETTINGS_KEYS.all>;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchSettings(): Promise<BackendSettings> {
  return unwrap(await commands.getSettings());
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

type UseBackendSettingsResult = {
  settings: BackendSettings | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<BackendSettings | undefined>;
};

/**
 * Subscribe to the engine's backend settings document. Returns
 * `undefined` until the first fetch resolves — sections should render
 * skeleton rows in that window instead of seeding inputs with zero
 * values that would round-trip back as a corrupt patch.
 */
export function useBackendSettings(
  config?: SWRConfiguration<BackendSettings>,
): UseBackendSettingsResult {
  const result = useSWR<BackendSettings, unknown, AllKey>(
    SETTINGS_KEYS.all(),
    fetchSettings,
    config,
  );

  return {
    settings: result.data,
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
 * Optimistically patch one section of `BackendSettings`, fire the
 * matching engine command, then let the response (or the
 * `SettingsChanged` event echo) revalidate. On failure we revert by
 * dropping the optimistic cache and forcing a refetch — the engine is
 * the source of truth.
 */
async function patchSection<K extends keyof BackendSettings>(
  section: K,
  next: BackendSettings[K],
  call: () => Promise<unknown>,
): Promise<void> {
  await globalMutate(
    SETTINGS_KEYS.all(),
    (prev: BackendSettings | undefined) =>
      prev ? { ...prev, [section]: next } : prev,
    { revalidate: false },
  );
  try {
    await call();
  } catch (err) {
    await globalMutate(SETTINGS_KEYS.all());
    throw err;
  }
}

export async function updateNetworkPrefs(prefs: NetworkPrefs): Promise<void> {
  await patchSection("network", prefs, async () => {
    unwrap(await commands.updateNetworkSettings(prefs));
  });
}

export async function updateAgentPrefs(prefs: AgentPrefs): Promise<void> {
  await patchSection("agents", prefs, async () => {
    unwrap(await commands.updateAgentSettings(prefs));
  });
}

export async function updateInboxPrefs(prefs: InboxPrefs): Promise<void> {
  await patchSection("inbox", prefs, async () => {
    unwrap(await commands.updateInboxSettings(prefs));
  });
}

export async function updateAdvancedPrefs(prefs: AdvancedPrefs): Promise<void> {
  await patchSection("advanced", prefs, async () => {
    unwrap(await commands.updateAdvancedSettings(prefs));
  });
}

// ---------------------------------------------------------------------------
// Engine-event sync
// ---------------------------------------------------------------------------

/**
 * Refetch settings whenever the engine reports an out-of-band change.
 * The CLI, MCP server, and a second app window all hit the same on-disk
 * settings; this hook keeps every reader honest without polling.
 *
 * Install once at React root via `<EngineSubscriptions />` (see
 * `src/components/layouts/root-layout.tsx`).
 */
export function useSettingsSync(): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    listenEngine(EngineEvent.SettingsChanged, (event) => {
      if (event.payload.kind !== "settingsChanged") return;
      globalMutate(SETTINGS_KEYS.all());
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
