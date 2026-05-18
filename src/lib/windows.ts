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

/**
 * Reveal the main window and close the onboarding window. Used at the
 * end of the onboarding flow. Each step is isolated so a single
 * permission gap can't leave the user stuck on a half-finished flow.
 */
export async function finishOnboardingWindow() {
  const main = await WebviewWindow.getByLabel("main").catch(() => null);
  if (main) {
    await main.show().catch((err) => console.error("main.show failed", err));
    await main
      .setFocus()
      .catch((err) => console.error("main.setFocus failed", err));
  }

  const onboarding = await WebviewWindow.getByLabel("onboarding").catch(
    () => null,
  );
  if (onboarding) {
    await onboarding
      .close()
      .catch((err) => console.error("onboarding.close failed", err));
  }
}
