import { useEffect } from "react";
import { toast } from "sonner";

import { isMainWindow } from "@/lib/window-label";
import { checkForUpdate } from "@/services/updater";
import { usePreferencesStore } from "@/stores/use-preferences-store";

const STARTUP_DELAY_MS = 5_000;
const RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000;

/**
 * Background updater poll. Runs on the main window only, after a short
 * post-launch delay, then every 24h. Surfaces a single toast when an
 * update is available and quietly swallows errors so the user is never
 * blocked by a flaky network. Manual checks live in Preferences.
 */
export function useAutoUpdateCheck() {
  const autoCheck = usePreferencesStore((s) => s.updates.autoCheck);

  useEffect(() => {
    if (!autoCheck) return;
    if (!isMainWindow()) return;

    let cancelled = false;

    const performCheck = async () => {
      try {
        const update = await checkForUpdate();
        if (cancelled || !update) return;
        toast(`Postcrate ${update.version} is available`, {
          description: "Open Preferences → Updates to install.",
          duration: 10_000,
        });
      } catch (err) {
        console.warn("Auto-update check failed:", err);
      }
    };

    const startupTimer = setTimeout(performCheck, STARTUP_DELAY_MS);
    const intervalTimer = setInterval(performCheck, RECHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(startupTimer);
      clearInterval(intervalTimer);
    };
  }, [autoCheck]);
}
