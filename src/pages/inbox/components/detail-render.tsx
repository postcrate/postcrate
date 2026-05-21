import { useMemo, useState } from "react";
import {
  CaretDownIcon,
  CaretRightIcon,
  CaretUpDownIcon,
  CheckIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferencesStore } from "@/stores/use-preferences-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_PROFILE,
  PROFILE_FAMILIES,
  PROFILE_FIDELITY,
  PROFILE_LABEL,
  useA11yReport,
  useLintReport,
  useRenderPreview,
  type Fidelity,
  type LintReport,
  type Profile,
} from "@/services/render";

import { composePreviewShell } from "./preview-shell";
import { forceColorScheme } from "./force-color-scheme";

const APPLE_PROFILES: ReadonlySet<Profile> = new Set([
  "apple_mail_mac",
  "apple_mail_ios",
]);

type Props = {
  emailId: string;
  hasHtml: boolean;
};

/**
 * "Render" tab on the email detail panel. Top half is a client-profile
 * picker + iframe that re-renders the HTML body through the engine's
 * per-client transform pipeline. Bottom half collapses HTML-lint and
 * a11y findings — both run on the raw body, not the transformed
 * output, so they're independent of the selected profile.
 */
export function DetailRender({ emailId, hasHtml }: Props) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const enableA11y = usePreferencesStore(
    (s) => s.privacy.enableA11yChecking,
  );

  if (!hasHtml) {
    return (
      <p className="text-muted-foreground px-6 py-10 text-center text-[12.5px]">
        No HTML body to render for this message.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 pb-5">
      <ProfilePreview emailId={emailId} profile={profile} onChange={setProfile} />
      <div className="flex flex-col gap-4 px-6">
        <LintCard emailId={emailId} />
        {enableA11y ? <A11yCard emailId={emailId} /> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile preview
// ---------------------------------------------------------------------------

function ProfilePreview({
  emailId,
  profile,
  onChange,
}: {
  emailId: string;
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  const { data, isLoading, error } = useRenderPreview(emailId, profile);
  const theme = usePreferencesStore((s) => s.inbox.emailPreviewTheme);
  const rendered = useMemo(() => {
    if (!data) return null;
    const applyAppleScheme = APPLE_PROFILES.has(profile);
    const { html, rewritten } = applyAppleScheme
      ? forceColorScheme(data.html, theme)
      : { html: data.html, rewritten: 0 };
    return {
      src: composePreviewShell(html, theme),
      schemeRewrites: rewritten,
    };
  }, [data, profile, theme]);

  const totalTransforms =
    (data?.applied.length ?? 0) + (rendered?.schemeRewrites ?? 0);
  const transformTitle = data
    ? [
        ...data.applied,
        rendered && rendered.schemeRewrites > 0
          ? `prefers-color-scheme: ${theme} activated on ${rendered.schemeRewrites} block${rendered.schemeRewrites === 1 ? "" : "s"}`
          : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <section className="border-border/60 mx-6 mt-5 overflow-hidden rounded-xl border">
      <header className="border-border/60 flex flex-wrap items-center gap-3 border-b px-3 py-2.5">
        <div className="text-muted-foreground/70 text-[10.5px] font-medium tracking-wider uppercase">
          Profile
        </div>
        <ProfilePicker value={profile} onChange={onChange} />
        {data ? <FidelityPill fidelity={data.fidelity} /> : null}
        {totalTransforms > 0 ? (
          <span
            className="text-muted-foreground/80 ml-auto truncate text-[11px]"
            title={`Applied: ${transformTitle}`}
          >
            {totalTransforms}{" "}
            {totalTransforms === 1 ? "transform" : "transforms"} applied
          </span>
        ) : null}
      </header>
      <div className="bg-muted/20 h-96">
        {isLoading && !rendered ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-8 w-32" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-destructive text-[12.5px]">
              Couldn&apos;t render this profile. {errorMessage(error)}
            </p>
          </div>
        ) : rendered ? (
          <iframe
            title={`Preview for ${PROFILE_LABEL[profile]}`}
            className="h-full w-full border-0"
            srcDoc={rendered.src}
            sandbox=""
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : null}
      </div>
    </section>
  );
}

function ProfilePicker({
  value,
  onChange,
}: {
  value: Profile;
  onChange: (p: Profile) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "border-input bg-background hover:bg-muted/40 data-[state=open]:bg-muted/50",
          "group/profile inline-flex h-7 items-center gap-1.5 rounded-md border pr-1.5 pl-2",
          "text-foreground text-[12px] outline-none transition-colors",
        )}
        aria-label={`Profile: ${PROFILE_LABEL[value]}`}
      >
        <span className="max-w-44 truncate">{PROFILE_LABEL[value]}</span>
        <CaretUpDownIcon
          size={10}
          weight="bold"
          className="text-muted-foreground/70 shrink-0"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-60 p-1">
        {PROFILE_FAMILIES.map((family, familyIdx) => (
          <div key={family.label}>
            {familyIdx > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
              {family.label}
            </DropdownMenuLabel>
            {family.profiles.map((p) => {
              const selected = p === value;
              return (
                <DropdownMenuItem
                  key={p}
                  onSelect={() => onChange(p)}
                  className="h-8 gap-2 px-2"
                >
                  <span className="text-foreground flex-1 truncate text-[12.5px]">
                    {PROFILE_LABEL[p]}
                  </span>
                  <FidelityPill fidelity={PROFILE_FIDELITY[p]} />
                  {selected ? (
                    <CheckIcon
                      size={11}
                      weight="bold"
                      className="text-foreground/80 shrink-0"
                    />
                  ) : (
                    <span className="size-[11px] shrink-0" aria-hidden />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FidelityPill({ fidelity }: { fidelity: Fidelity }) {
  const styles =
    fidelity === "high"
      ? "bg-success/12 text-success"
      : fidelity === "approximate"
        ? "bg-muted text-muted-foreground"
        : "bg-warn/15 text-warn";
  return (
    <span
      className={cn(
        styles,
        "inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-medium tracking-tight uppercase",
      )}
      title={fidelityHint(fidelity)}
    >
      {fidelity}
    </span>
  );
}

function fidelityHint(f: Fidelity): string {
  switch (f) {
    case "high":
      return "Close to the real client";
    case "approximate":
      return "Common cases match. Edge cases may differ";
    case "experimental":
      return "Best effort. This client is hard to simulate";
  }
}

// ---------------------------------------------------------------------------
// Lint
// ---------------------------------------------------------------------------

function LintCard({ emailId }: { emailId: string }) {
  const { data, isLoading, error } = useLintReport(emailId);
  const count = data?.warnings.length ?? 0;
  const [open, setOpen] = useState(true);

  return (
    <Collapsible
      title="HTML lint"
      subtitle="Known compatibility issues across major email clients."
      count={count}
      tone={count > 0 ? "warn" : "ok"}
      open={open}
      onToggle={() => setOpen((o) => !o)}
    >
      {isLoading && !data ? (
        <CardSkeleton rows={2} />
      ) : error ? (
        <CardError message={errorMessage(error)} />
      ) : data ? (
        data.warnings.length === 0 ? (
          <CardEmpty message="No lint warnings. Clean across the board." />
        ) : (
          <LintRows report={data} />
        )
      ) : null}
    </Collapsible>
  );
}

function LintRows({ report }: { report: LintReport }) {
  return (
    <ul className="border-border/60 divide-border/60 divide-y border-t">
      {report.warnings.map((w, i) => (
        <li
          key={`${w.rule}-${i}`}
          className="flex items-start gap-2.5 px-4 py-2.5"
        >
          <SeverityChip severity={w.severity} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-foreground font-mono text-[11.5px]">
                {w.rule}
              </span>
              {w.byteOffset !== null ? (
                <span className="text-muted-foreground/70 font-mono text-[10.5px] tabular-nums">
                  @{w.byteOffset}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-0.5 text-[11.5px] leading-snug">
              {w.message}
            </p>
            {w.affects.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {w.affects.map((c) => (
                  <span
                    key={c}
                    className="border-border/60 bg-muted/50 text-muted-foreground inline-flex h-4 items-center rounded border px-1 text-[10px]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// A11y
// ---------------------------------------------------------------------------

function A11yCard({ emailId }: { emailId: string }) {
  const { data, isLoading, error } = useA11yReport(emailId);
  const count = data?.findings.length ?? 0;
  const [open, setOpen] = useState(true);

  return (
    <Collapsible
      title="Accessibility"
      subtitle="Source-level checks for alt text, contrast hints, and semantic structure."
      count={count}
      tone={count > 0 ? "warn" : "ok"}
      open={open}
      onToggle={() => setOpen((o) => !o)}
    >
      {isLoading && !data ? (
        <CardSkeleton rows={2} />
      ) : error ? (
        <CardError message={errorMessage(error)} />
      ) : data ? (
        data.findings.length === 0 ? (
          <CardEmpty message="Nothing to flag." />
        ) : (
          <ul className="border-border/60 divide-border/60 divide-y border-t">
            {data.findings.map((f, i) => (
              <li
                key={`${f.rule}-${i}`}
                className="flex items-start gap-2.5 px-4 py-2.5"
              >
                <SeverityChip severity={f.severity} />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground font-mono text-[11.5px]">
                    {f.rule}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-[11.5px] leading-snug">
                    {f.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

function Collapsible({
  title,
  subtitle,
  count,
  tone,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  tone: "ok" | "warn";
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Caret = open ? CaretDownIcon : CaretRightIcon;
  return (
    <section className="border-border/60 overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-muted/30 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
      >
        <Caret
          size={11}
          weight="bold"
          className="text-muted-foreground shrink-0"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-[13px] font-semibold leading-none tracking-tight">
            {title}
          </h3>
          <p className="text-muted-foreground mt-1 truncate text-[11.5px]">
            {subtitle}
          </p>
        </div>
        <CountPill count={count} tone={tone} />
      </button>
      {open ? children : null}
    </section>
  );
}

function CountPill({
  count,
  tone,
}: {
  count: number;
  tone: "ok" | "warn";
}) {
  if (count === 0) {
    return (
      <span className="bg-success/12 text-success inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium tracking-tight">
        Clean
      </span>
    );
  }
  const styles =
    tone === "warn"
      ? "bg-warn/15 text-warn"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        styles,
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium tracking-tight tabular-nums",
      )}
    >
      {count} {count === 1 ? "issue" : "issues"}
    </span>
  );
}

function SeverityChip({ severity }: { severity: string }) {
  const styles =
    severity === "high" || severity === "error"
      ? "bg-destructive/12 text-destructive"
      : severity === "medium" || severity === "warning"
        ? "bg-warn/15 text-warn"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        styles,
        "inline-flex h-4.5 shrink-0 items-center rounded px-1.5 text-[10px] font-medium uppercase tracking-wider",
      )}
    >
      {severity}
    </span>
  );
}

function CardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2 px-4 pb-4 pt-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

function CardError({ message }: { message: string }) {
  return (
    <div className="border-destructive/30 bg-destructive/5 mx-4 mb-4 mt-3 flex items-start gap-2.5 rounded-lg border px-3 py-2.5">
      <WarningIcon
        size={13}
        weight="regular"
        className="text-destructive mt-0.5 shrink-0"
      />
      <p className="text-destructive text-[11.5px] leading-snug">
        {message}
      </p>
    </div>
  );
}

function CardEmpty({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground px-4 pb-4 pt-3 text-[11.5px]">
      {message}
    </p>
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Couldn't load this report.";
}

