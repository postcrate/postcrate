import { useCallback, useEffect, useRef, useState } from "react";

import { createMailbox } from "@/services/mailbox";
import { finishOnboardingWindow } from "@/lib/windows";
import { useProjectsStore } from "@/stores/use-projects-store";
import { updateNetworkPrefs, useBackendSettings } from "@/services/settings";
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
    title: "Postcrate",
    subtitle: "A local inbox for the email your apps send while you build.",
  },
  1: {
    title: "Set your defaults",
    subtitle: "Your first project, SMTP port, and mailbox.",
  },
  2: {
    title: "Wire it up",
    subtitle: "Paste one of these into the app you're testing.",
  },
};

type StepHandler = () => Promise<boolean>;

export default function OnboardingPage() {
  const step = useOnboardingStore((s) => s.step);
  const setStep = useOnboardingStore((s) => s.setStep);
  const complete = useOnboardingStore((s) => s.complete);
  const draft = useOnboardingStore((s) => s.draft);

  const addProject = useProjectsStore((s) => s.addProject);
  const { settings } = useBackendSettings();

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

    const project = addProject({
      name: draft.projectName,
      tone: draft.projectTone,
    });

    if (settings && settings.network.smtpPort !== draft.smtpPort) {
      try {
        await updateNetworkPrefs({
          ...settings.network,
          smtpPort: draft.smtpPort,
        });
      } catch (err) {
        console.error("Couldn't persist SMTP port preference:", err);
      }
    }

    // Best-effort: create the default mailbox in the engine. If the
    // engine isn't reachable we still complete onboarding so the user
    // lands on the empty Mailboxes page and can retry from there.
    try {
      await createMailbox({
        projectId: project.id,
        name: draft.mailboxName,
        kind: "primary",
        port: draft.smtpPort,
        ttlSeconds: null,
        implicitTls: false,
      });
    } catch (err) {
      console.error("Default mailbox creation failed:", err);
    }

    complete();
    await finishOnboardingWindow();
  }, [addProject, complete, draft, settings]);

  const copy = COPY[step];
  const isLast = step === 2;

  return (
    <Frame
      step={step}
      title={copy.title}
      subtitle={copy.subtitle}
      icon={step === 0 ? "/app-icon.png" : undefined}
      primary={
        isLast
          ? {
              label: finishing ? "Setting up…" : "Open Postcrate",
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
