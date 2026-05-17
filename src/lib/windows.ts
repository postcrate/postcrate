import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export async function openPreferencesWindow() {
  try {
    const win = await WebviewWindow.getByLabel("preferences");
    if (!win) return;
    await win.show();
    await win.unminimize();
    await win.setFocus();
  } catch {
    /* not running under Tauri */
  }
}
