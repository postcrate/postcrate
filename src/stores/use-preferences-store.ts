import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * UI-only preferences.
 *
 * Engine-backed sections (network, agents, inbox.retention/tagging,
 * advanced) live in `src/services/settings.ts` and round-trip through
 * the Rust engine. Anything in *this* store is purely cosmetic / OS
 * integration / view state — it has no engine counterpart and is safe
 * to persist client-side.
 */

export const PREFERENCES_STORAGE_KEY = "postcrate-preferences";

export type Density = "comfortable" | "compact";
export type EmailPreviewTheme = "light" | "dark";
export type UpdateChannel = "stable" | "beta";

export type AppearancePrefs = {
  density: Density;
  monoForCode: boolean;
};

export type GeneralPrefs = {
  /**
   * macOS dock-icon visibility. Persisted client-side because Tauri's
   * `setDockVisibility` doesn't survive app restarts — we re-apply
   * this on every boot.
   */
  showInDock: boolean;
  /**
   * Tauri-normalized accelerator string (e.g. "CommandOrControl+Shift+P").
   * The OS-side registration is owned by `useGlobalShortcutSync`.
   */
  globalShortcut: string;
};

export type NotificationPrefs = {
  desktopOnNewEmail: boolean;
  inAppToast: boolean;
  soundOnNewEmail: boolean;
  badgeUnreadCount: boolean;
};

export type InboxViewPrefs = {
  /**
   * Light/dark mode of the email-body iframe in the Preview and Render
   * tabs. Decoupled from the app theme so users can audit how an email
   * looks in the *other* mode without switching their whole UI.
   */
  emailPreviewTheme: EmailPreviewTheme;
};

export type PrivacyPrefs = {
  enableSpamScoring: boolean;
  enableLinkChecking: boolean;
  enableA11yChecking: boolean;
};

export type UpdatesPrefs = {
  autoCheck: boolean;
  channel: UpdateChannel;
};

type Sections = {
  appearance: AppearancePrefs;
  general: GeneralPrefs;
  notifications: NotificationPrefs;
  inbox: InboxViewPrefs;
  privacy: PrivacyPrefs;
  updates: UpdatesPrefs;
};

type PreferencesState = Sections & {
  update: <K extends keyof Sections>(
    section: K,
    patch: Partial<Sections[K]>,
  ) => void;
  reset: () => void;
};

const defaults: Sections = {
  appearance: {
    density: "comfortable",
    monoForCode: true,
  },
  general: {
    showInDock: true,
    globalShortcut: "CommandOrControl+Shift+P",
  },
  notifications: {
    desktopOnNewEmail: true,
    inAppToast: true,
    soundOnNewEmail: false,
    badgeUnreadCount: true,
  },
  inbox: {
    emailPreviewTheme: "light",
  },
  privacy: {
    enableSpamScoring: true,
    enableLinkChecking: false,
    enableA11yChecking: true,
  },
  updates: {
    autoCheck: true,
    channel: "stable",
  },
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      update: (section, patch) =>
        set((state) => ({
          [section]: { ...state[section], ...patch },
        })),
      reset: () => set(defaults),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
