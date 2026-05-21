/**
 * Bridges the General preferences section to the OS:
 *
 *   - `useDockVisibilitySync` — applies `showInDock` via Tauri's
 *     `setDockVisibility` on boot and on changes. macOS-only in
 *     practice; calls degrade silently on other platforms.
 *   - `useGlobalShortcutSync` — registers/unregisters the user's
 *     global accelerator. Handler brings the main window to the
 *     front (shows + unminimizes + focuses).
 *
 * Both install once at React root via `<RootLayout />`. Launch-at-login
 * has no sync hook because the OS is the source of truth — the prefs
 * UI queries `@tauri-apps/plugin-autostart`'s `isEnabled()` directly.
 */

import { useEffect, useRef } from "react";
import { setDockVisibility } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  register,
  unregister,
} from "@tauri-apps/plugin-global-shortcut";

import { usePreferencesStore } from "@/stores/use-preferences-store";

/**
 * Push `general.showInDock` to Tauri's dock-visibility API. Runs on
 * mount and whenever the pref changes. Errors are swallowed because
 * non-macOS platforms reject the call but the prefs UI is still valid.
 */
export function useDockVisibilitySync(): void {
  const showInDock = usePreferencesStore((s) => s.general.showInDock);

  useEffect(() => {
    setDockVisibility(showInDock).catch(() => {
      // Not macOS, or the private API isn't available — silently degrade.
    });
  }, [showInDock]);
}

/**
 * Register a global accelerator that, when pressed, shows + focuses
 * the main window. The previous shortcut is unregistered first so a
 * change in prefs doesn't leak a dangling binding.
 */
export function useGlobalShortcutSync(): void {
  const shortcut = usePreferencesStore((s) => s.general.globalShortcut);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const previous = prev.current;
    let cancelled = false;

    async function apply() {
      if (previous && previous !== shortcut) {
        await unregister(previous).catch(() => {
          // Wasn't registered; fine.
        });
      }
      if (!shortcut) return;
      try {
        await register(shortcut, (event) => {
          if (event.state !== "Pressed") return;
          void bringMainToFront();
        });
        if (!cancelled) prev.current = shortcut;
      } catch {
        // Invalid accelerator or already taken — leave the previous
        // binding (if any) in place.
      }
    }

    void apply();
    return () => {
      cancelled = true;
    };
  }, [shortcut]);

  // Cleanup on unmount: drop whatever's currently registered.
  useEffect(() => {
    return () => {
      const current = prev.current;
      if (current) {
        unregister(current).catch(() => {
          // Already gone.
        });
      }
    };
  }, []);
}

async function bringMainToFront(): Promise<void> {
  try {
    // Best-effort: make sure we're visible in the dock first on macOS
    // so the show + focus actually surfaces the window.
    await setDockVisibility(true).catch(() => {});
    const win = getCurrentWindow();
    await win.show();
    await win.unminimize();
    await win.setFocus();
  } catch {
    // Window operations should never throw user-visibly.
  }
}
