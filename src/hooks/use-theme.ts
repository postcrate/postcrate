import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import {
  useThemeStore,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/stores/use-theme-store";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function getSystemResolved(): "light" | "dark" {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function resolve(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemResolved() : theme;
}

function applyToDocument(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

async function syncTauriWindow(theme: Theme) {
  try {
    await getCurrentWindow().setTheme(theme === "system" ? null : theme);
  } catch {
    /* not running in Tauri or API unavailable */
  }
}

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    applyToDocument(resolve(theme));
    syncTauriWindow(theme);

    if (theme !== "system") return;

    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => applyToDocument(getSystemResolved());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Cross-window sync: when another webview window mutates the persisted
  // theme, rehydrate this window's store so the change propagates.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === THEME_STORAGE_KEY) useThemeStore.persist.rehydrate();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { theme, setTheme, resolved: resolve(theme) };
}
