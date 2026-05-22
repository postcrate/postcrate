import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Current Tauri window label, cached for the lifetime of this webview.
 * Returns `null` outside of Tauri (e.g. plain `vite` dev without the
 * shell). The label is fixed at window creation, so caching is safe.
 */
let cached: string | null | undefined;

export function currentWindowLabel(): string | null {
  if (cached !== undefined) return cached;
  try {
    cached = getCurrentWindow().label;
  } catch {
    cached = null;
  }
  return cached;
}

/**
 * The "main" window owns the user-facing inbox + nav. Side effects from
 * engine-event subscriptions (toasts, chimes, system notifications,
 * unread badge bumps) should only fire here so secondary windows
 * (Preferences, Onboarding) don't double-up on the same event.
 */
export function isMainWindow(): boolean {
  return currentWindowLabel() === "main";
}
