import { m } from "motion/react";

import { Button } from "@/components/ui/button";

import { Stepper } from "./stepper";

type FrameProps = {
  step: 0 | 1 | 2;
  title: string;
  subtitle: string;
  primary: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void };
  children: React.ReactNode;
};

export function Frame({
  step,
  title,
  subtitle,
  primary,
  secondary,
  children,
}: FrameProps) {
  return (
    <div className="text-foreground bg-background flex h-screen flex-col">
      <div data-tauri-drag-region className="h-10 shrink-0" />

      <div className="flex min-h-0 flex-1 flex-col px-7">
        <header className="mb-5 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground mt-0.5 text-[12.5px] leading-snug">
              {subtitle}
            </p>
          </div>
          <Stepper step={step} />
        </header>

        <m.div
          key={step}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {children}
        </m.div>
      </div>

      <footer className="border-border/60 flex h-16 shrink-0 items-center justify-between border-t px-6">
        <div>
          {secondary ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={secondary.onClick}
              className="px-2 text-[12.5px]"
            >
              {secondary.label}
            </Button>
          ) : null}
        </div>
        <Button
          size="sm"
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="min-w-24 text-[12.5px]"
        >
          {primary.label}
        </Button>
      </footer>
    </div>
  );
}
