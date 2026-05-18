import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { router } from "@/routes";
import {
  rehydrateAllStores,
  installCrossWindowStoreSync,
} from "@/stores/sync";
import {
  ONBOARDING_STORAGE_KEY,
  readOnboardingCompletedSync,
} from "@/stores/use-onboarding-store";
import "@/styles/globals.css";

if (import.meta.env.PROD) {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    { passive: false },
  );
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && (key === "r" || key === "0" || key === "+" || key === "=" || key === "-")) {
      e.preventDefault();
    }
  });
}

installCrossWindowStoreSync();
bootstrapWindow();

function mountApp() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}

/**
 * `main` and `onboarding` both load this entry, but only one should be
 * visible at a time. Reading the onboarding flag synchronously avoids a
 * flash of the wrong window. Main does NOT mount its React tree until
 * onboarding is complete — it waits on a cross-window `storage` event
 * (zustand-persist writes a fresh blob whenever `completed` flips).
 */
async function bootstrapWindow() {
  const current = safeCurrentWindow();
  if (!current) {
    mountApp();
    return;
  }

  const completed = readOnboardingCompletedSync();

  if (current.label === "main") {
    if (completed) {
      mountApp();
      await current.show();
      await current.setFocus();
      return;
    }
    // Main stays blank + hidden until onboarding finishes.
    const onboarding = await WebviewWindow.getByLabel("onboarding");
    if (onboarding) {
      await onboarding.show();
      await onboarding.setFocus();
    }
    waitForOnboardingComplete(async () => {
      // Stores were instantiated in this window before onboarding wrote
      // to localStorage from the other window — pull the latest blobs
      // into memory before React reads them.
      await rehydrateAllStores();
      mountApp();
      await current.show();
      await current.setFocus();
    });
    return;
  }

  if (current.label === "onboarding") {
    if (completed) {
      await current.close();
      return;
    }
    mountApp();
    await current.show();
    await current.setFocus();
    return;
  }

  // Any other window (e.g. preferences) renders immediately.
  mountApp();
}

function waitForOnboardingComplete(onComplete: () => void) {
  const handler = (event: StorageEvent) => {
    if (event.key !== ONBOARDING_STORAGE_KEY) return;
    if (!readOnboardingCompletedSync()) return;
    window.removeEventListener("storage", handler);
    onComplete();
  };
  window.addEventListener("storage", handler);
}

function safeCurrentWindow(): ReturnType<typeof getCurrentWindow> | null {
  try {
    return getCurrentWindow();
  } catch {
    return null;
  }
}
