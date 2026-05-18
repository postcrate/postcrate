import { useCallback, useEffect, useRef, useState } from "react";

import { finishOnboardingWindow } from "@/lib/windows";
import { useProjectsStore } from "@/stores/use-projects-store";
import { usePreferencesStore } from "@/stores/use-preferences-store";
import {
  useOnboardingStore,
  type OnboardingStep,
} from "@/stores/use-onboarding-store";

import { Frame } from "./components/frame";
import { StepIntro } from "./components/step-intro";
import { StepDefaults } from "./components/step-defaults";
import { StepSnippets } from "./components/step-snippets";

type StepCopy = { title: string; subtitle: string };

const COPY: Record<OnboardingStep, StepCopy> = {
  0: {
    title: "Welcome to postcrate",
    subtitle: "An offline-first inbox for the email your apps send while you build.",
  },
  1: {
    title: "Set your defaults",
    subtitle: "These power the first project, the SMTP listener, and the mailbox.",
  },
  2: {
    title: "Plug it in",
    subtitle: "Drop these into the project you're testing and you're ready.",
  },
};

type StepHandler = () => Promise<boolean>;

export default function OnboardingPage() {
  const step = useOnboardingStore((s) => s.step);
  const setStep = useOnboardingStore((s) => s.setStep);
  const complete = useOnboardingStore((s) => s.complete);
  const draft = useOnboardingStore((s) => s.draft);

  const addProject = useProjectsStore((s) => s.addProject);
  const updatePrefs = usePreferencesStore((s) => s.update);

  const stepSubmit = useRef<StepHandler | null>(null);
  const finishedRef = useRef(false);
  const [finishing, setFinishing] = useState(false);

  const registerSubmit = useCallback((handler: StepHandler | null) => {
    stepSubmit.current = handler;
  }, []);

  // If somebody re-enters with a stale step, clamp it.
  useEffect(() => {
    if (step < 0 || step > 2) setStep(0);
  }, [step, setStep]);

  const goNext = useCallback(async () => {
    if (stepSubmit.current) {
      const ok = await stepSubmit.current();
      if (!ok) return;
    }
    if (step < 2) setStep((step + 1) as OnboardingStep);
  }, [setStep, step]);

  const goBack = useCallback(() => {
    if (step > 0) setStep((step - 1) as OnboardingStep);
  }, [setStep, step]);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishing(true);
    addProject({ name: draft.projectName });
    updatePrefs("network", { smtpPort: draft.smtpPort });
    complete();
    await finishOnboardingWindow();
  }, [addProject, complete, draft, updatePrefs]);

  const copy = COPY[step];
  const isLast = step === 2;

  return (
    <Frame
      step={step}
      title={copy.title}
      subtitle={copy.subtitle}
      primary={
        isLast
          ? {
              label: finishing ? "Setting up…" : "Ready to go",
              onClick: finish,
              disabled: finishing,
            }
          : { label: step === 0 ? "Get started" : "Continue", onClick: goNext }
      }
      secondary={
        step > 0 && !finishing ? { label: "Back", onClick: goBack } : undefined
      }
    >
      {step === 0 ? <StepIntro /> : null}
      {step === 1 ? <StepDefaults registerSubmit={registerSubmit} /> : null}
      {step === 2 ? <StepSnippets /> : null}
    </Frame>
  );
}
