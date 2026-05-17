import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const PREFERENCES_STORAGE_KEY = "postcrate-preferences";

export type Density = "comfortable" | "compact";
export type InboxView = "list" | "compact" | "cards";
export type UpdateChannel = "stable" | "beta";

export type AppearancePrefs = {
  density: Density;
  monoForCode: boolean;
};

export type GeneralPrefs = {
  launchAtLogin: boolean;
  showInDock: boolean;
  showInMenuBar: boolean;
  singleInstance: boolean;
  globalShortcut: string;
};

export type NotificationPrefs = {
  desktopOnNewEmail: boolean;
  inAppToast: boolean;
  soundOnNewEmail: boolean;
  badgeUnreadCount: boolean;
};

export type InboxPrefs = {
  defaultView: InboxView;
  threadRelated: boolean;
  autoTag: boolean;
  maxRetainedEmails: number;
  autoClearAfterDays: number;
};

export type NetworkPrefs = {
  smtpPort: number;
  httpApiPort: number;
  mcpEnabled: boolean;
  mcpPort: number;
  exposeOnLan: boolean;
};

export type AgentPrefs = {
  defaultWaitTimeoutSeconds: number;
  logAgentRequests: boolean;
  confirmDestructiveActions: boolean;
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

export type AdvancedPrefs = {
  debugLogging: boolean;
  preserveSmtpTranscript: boolean;
};

type Sections = {
  appearance: AppearancePrefs;
  general: GeneralPrefs;
  notifications: NotificationPrefs;
  inbox: InboxPrefs;
  network: NetworkPrefs;
  agents: AgentPrefs;
  privacy: PrivacyPrefs;
  updates: UpdatesPrefs;
  advanced: AdvancedPrefs;
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
    launchAtLogin: false,
    showInDock: true,
    showInMenuBar: true,
    singleInstance: true,
    globalShortcut: "CmdOrCtrl+Shift+P",
  },
  notifications: {
    desktopOnNewEmail: true,
    inAppToast: true,
    soundOnNewEmail: false,
    badgeUnreadCount: true,
  },
  inbox: {
    defaultView: "list",
    threadRelated: true,
    autoTag: true,
    maxRetainedEmails: 5000,
    autoClearAfterDays: 14,
  },
  network: {
    smtpPort: 1025,
    httpApiPort: 1080,
    mcpEnabled: true,
    mcpPort: 1081,
    exposeOnLan: false,
  },
  agents: {
    defaultWaitTimeoutSeconds: 30,
    logAgentRequests: true,
    confirmDestructiveActions: true,
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
  advanced: {
    debugLogging: false,
    preserveSmtpTranscript: true,
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
