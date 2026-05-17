import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useFullscreen(): boolean {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    const win = getCurrentWindow();

    async function sync() {
      try {
        const next = await win.isFullscreen();
        if (!cancelled) setIsFullscreen(next);
      } catch {
        /* not running in Tauri */
      }
    }

    sync();

    win
      .onResized(() => {
        sync();
      })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {
        /* not running in Tauri */
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  return isFullscreen;
}
