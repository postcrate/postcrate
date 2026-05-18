import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ONBOARDING_STORAGE_KEY = "postcrate-onboarding";

export type OnboardingStep = 0 | 1 | 2;

export type OnboardingDraft = {
  projectName: string;
  smtpPort: number;
  mailboxName: string;
};

export const DEFAULT_DRAFT: OnboardingDraft = {
  projectName: "Personal",
  smtpPort: 1025,
  mailboxName: "default",
};

type OnboardingState = {
  completed: boolean;
  step: OnboardingStep;
  draft: OnboardingDraft;
  setStep: (step: OnboardingStep) => void;
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
  complete: () => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      step: 0,
      draft: DEFAULT_DRAFT,
      setStep: (step) => set({ step }),
      patchDraft: (patch) =>
        set((state) => ({ draft: { ...state.draft, ...patch } })),
      complete: () => set({ completed: true }),
      reset: () => set({ completed: false, step: 0, draft: DEFAULT_DRAFT }),
    }),
    { name: ONBOARDING_STORAGE_KEY },
  ),
);

/**
 * Read the `completed` flag synchronously before React mounts, so the
 * window bootstrap in `main.tsx` can decide which webview to surface
 * without flashing the wrong one.
 */
export function readOnboardingCompletedSync(): boolean {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { completed?: boolean } };
    return Boolean(parsed.state?.completed);
  } catch {
    return false;
  }
}
