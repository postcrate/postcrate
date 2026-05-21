import { useViewStore } from "./use-view-store";
import { useThemeStore } from "./use-theme-store";
import { useProjectsStore } from "./use-projects-store";
import { useOnboardingStore } from "./use-onboarding-store";
import { usePreferencesStore } from "./use-preferences-store";

/**
 * Every persisted zustand store in the app, keyed by its localStorage
 * name. A single source of truth so cross-window sync and explicit
 * rehydration can iterate over the same list.
 */
const PERSISTED_STORES = [
  useOnboardingStore,
  useProjectsStore,
  usePreferencesStore,
  useViewStore,
  useThemeStore,
] as const;

type PersistedStore = (typeof PERSISTED_STORES)[number];

function storageKey(store: PersistedStore): string | undefined {
  // zustand's persist middleware exposes the config via `.persist.getOptions().name`.
  return store.persist.getOptions().name;
}

/**
 * Pull the latest persisted state into every store. Use before mounting
 * React in a window that came up after another window wrote to
 * localStorage — otherwise the in-memory state from module-load time
 * wins and you see stale UI.
 */
export async function rehydrateAllStores(): Promise<void> {
  await Promise.all(PERSISTED_STORES.map((s) => s.persist.rehydrate()));
}

/**
 * Listen for cross-window localStorage writes and rehydrate the
 * matching store. Idempotent — call once at app boot.
 */
export function installCrossWindowStoreSync(): () => void {
  const byKey = new Map<string, PersistedStore>();
  for (const store of PERSISTED_STORES) {
    const key = storageKey(store);
    if (key) byKey.set(key, store);
  }

  const handler = (event: StorageEvent) => {
    if (!event.key) return;
    const store = byKey.get(event.key);
    if (store) void store.persist.rehydrate();
  };

  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
