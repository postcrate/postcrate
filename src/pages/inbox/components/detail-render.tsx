import { useMemo, useState } from "react";
import {
  CaretDownIcon,
  CaretRightIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { type Fidelity, type Profile } from "@/lib/bridge/bindings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_PROFILE,
  PROFILE_LABEL,
  PROFILE_ORDER,
  useA11yReport,
  useLintReport,
  useRenderPreview,
  type LintReport,
} from "@/services/render";

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

  if (!hasHtml) {
    return (
      <p className="text-muted-foreground px-6 py-10 text-center text-[12.5px]">
        This message has no HTML body to render.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <ProfilePreview emailId={emailId} profile={profile} onChange={setProfile} />
      <div className="flex flex-col gap-4 px-6 pb-5">
        <LintCard emailId={emailId} />
        <A11yCard emailId={emailId} />
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
  const { resolved } = useTheme();
  const composed = useMemo(
    () => (data ? composeShell(data.html, resolved) : null),
    [data, resolved],
  );

  return (
    <section className="border-border/60 mx-6 mt-5 overflow-hidden rounded-xl border">
      <header className="border-border/60 flex flex-wrap items-center gap-3 border-b px-3 py-2.5">
        <div className="text-muted-foreground/70 text-[10.5px] font-medium tracking-wider uppercase">
          Profile
        </div>
        <Select value={profile} onValueChange={(v) => onChange(v as Profile)}>
          <SelectTrigger className="h-7 w-44 text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROFILE_ORDER.map((p) => (
              <SelectItem key={p} value={p}>
                {PROFILE_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data ? <FidelityPill fidelity={data.fidelity} /> : null}
        {data && data.applied.length > 0 ? (
          <span
            className="text-muted-foreground/80 ml-auto truncate text-[11px]"
            title={`Applied: ${data.applied.join(", ")}`}
          >
            {data.applied.length}{" "}
            {data.applied.length === 1 ? "transform" : "transforms"} applied
          </span>
        ) : null}
      </header>
      <div className="bg-muted/20 h-96">
        {isLoading && !composed ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-8 w-32" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-destructive text-[12.5px]">
              Couldn&apos;t render this profile — {errorMessage(error)}
            </p>
          </div>
        ) : composed ? (
          <iframe
            title={`Preview for ${PROFILE_LABEL[profile]}`}
            className="h-full w-full border-0 bg-transparent"
            srcDoc={composed}
            sandbox=""
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : null}
      </div>
    </section>
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
      return "Render is very close to the real client";
    case "approximate":
      return "Common cases approximated; edge cases may differ";
    case "experimental":
      return "Best-effort — this client is hard to simulate";
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
      subtitle="Known compatibility issues with major email clients."
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
          <CardEmpty message="No lint warnings — clean across the board." />
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
      subtitle="Light source-level checks: alt text, color contrast hints, semantic structure."
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
          <CardEmpty message="No accessibility findings." />
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
  return "Couldn't load report.";
}

function composeShell(body: string, theme: "light" | "dark"): string {
  return `<!doctype html><html data-theme="${theme}"><head>
<meta charset="utf-8">
<meta name="referrer" content="no-referrer">
<base target="_blank">
<style>
  html,body{margin:0;padding:16px;background:transparent;color:#0a0a0a;
    font:13px/1.55 -apple-system,BlinkMacSystemFont,Segoe UI,Inter,sans-serif}
  html[data-theme="dark"]{color:#e9e9eb}
  html[data-theme="dark"] body{color:#e9e9eb}
  img{max-width:100%;height:auto}
  a{color:#2563eb} a:hover{text-decoration:underline}
  html[data-theme="dark"] a{color:#60a5fa}
  table{max-width:100%}
</style>
</head><body>${body}</body></html>`;
}
