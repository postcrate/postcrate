import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { type AuthVerdict } from "@/lib/bridge/bindings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAuthReport,
  useLinkReport,
  useSpamReport,
  useUnsubReport,
  type AuthReport,
  type LinkReport,
  type SpamReport,
  type UnsubReport,
} from "@/services/inspect";

type Props = {
  emailId: string;
};

/**
 * "Inspect" tab on the email detail panel. Four deliverability /
 * safety reports stacked vertically, each loading independently so a
 * slow one doesn't block the others. Card chrome and typography
 * mirror the section-card pattern used on Mailboxes / Webhooks pages.
 */
export function DetailInspect({ emailId }: Props) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <SpamCard emailId={emailId} />
      <AuthCard emailId={emailId} />
      <LinksCard emailId={emailId} />
      <UnsubCard emailId={emailId} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spam
// ---------------------------------------------------------------------------

function SpamCard({ emailId }: { emailId: string }) {
  const { data, isLoading, error } = useSpamReport(emailId);

  return (
    <Card
      title="Spam"
      subtitle="Local heuristic score. No DNS/RBL lookups."
      action={data ? <SpamVerdictPill report={data} /> : null}
    >
      {isLoading && !data ? (
        <CardSkeleton rows={3} />
      ) : error ? (
        <CardError message={errorMessage(error)} />
      ) : data ? (
        data.factors.length === 0 ? (
          <CardEmpty message="No factors triggered — score is the baseline." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <Th className="w-44 pl-4">Rule</Th>
                <Th className="w-20 text-right">Score</Th>
                <Th>Detail</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.factors.map((f, i) => (
                <TableRow key={`${f.rule}-${i}`} className="hover:bg-transparent">
                  <TableCell className="text-foreground py-2 pl-4 font-mono text-[11.5px]">
                    {f.rule}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "py-2 text-right font-mono text-[11.5px] tabular-nums",
                      f.score > 0 ? "text-destructive" : "text-success",
                    )}
                  >
                    {f.score > 0 ? "+" : ""}
                    {f.score.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2 pr-4 text-[11.5px]">
                    {f.detail}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : null}
    </Card>
  );
}

function SpamVerdictPill({ report }: { report: SpamReport }) {
  const styles =
    report.verdict === "clean"
      ? "bg-success/12 text-success"
      : report.verdict === "suspicious"
        ? "bg-warn/15 text-warn"
        : "bg-destructive/12 text-destructive";
  const label =
    report.verdict === "clean"
      ? "Clean"
      : report.verdict === "suspicious"
        ? "Suspicious"
        : "Likely spam";
  return (
    <span
      className={cn(
        styles,
        "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium tracking-tight",
      )}
    >
      {label}
      <span className="text-foreground/70 font-mono tabular-nums">
        {report.score.toFixed(1)}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Auth (SPF / DKIM / DMARC)
// ---------------------------------------------------------------------------

function AuthCard({ emailId }: { emailId: string }) {
  const { data, isLoading, error } = useAuthReport(emailId);

  return (
    <Card
      title="Authentication"
      subtitle="SPF / DKIM / DMARC verdict from Authentication-Results header."
    >
      {isLoading && !data ? (
        <CardSkeleton rows={2} />
      ) : error ? (
        <CardError message={errorMessage(error)} />
      ) : data ? (
        <AuthBody report={data} />
      ) : null}
    </Card>
  );
}

function AuthBody({ report }: { report: AuthReport }) {
  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-3 gap-2.5">
        <AuthVerdictTile label="SPF" verdict={report.spf} />
        <AuthVerdictTile label="DKIM" verdict={report.dkim} />
        <AuthVerdictTile label="DMARC" verdict={report.dmarc} />
      </div>

      <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-[11.5px]">
        <dt className="text-muted-foreground">DKIM signature</dt>
        <dd className="text-foreground">
          {report.hasDkimSignature ? "Present" : "Missing"}
        </dd>
        {report.authenticationResults ? (
          <>
            <dt className="text-muted-foreground self-start">
              Authentication-Results
            </dt>
            <dd className="text-foreground font-mono break-all">
              {report.authenticationResults}
            </dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

function AuthVerdictTile({
  label,
  verdict,
}: {
  label: string;
  verdict: AuthVerdict;
}) {
  const styles =
    verdict === "pass"
      ? "border-success/30 bg-success/8"
      : verdict === "fail"
        ? "border-destructive/30 bg-destructive/8"
        : verdict === "softfail"
          ? "border-warn/30 bg-warn/8"
          : "border-border/60 bg-muted/30";
  const textColor =
    verdict === "pass"
      ? "text-success"
      : verdict === "fail"
        ? "text-destructive"
        : verdict === "softfail"
          ? "text-warn"
          : "text-muted-foreground";

  return (
    <div className={cn(styles, "rounded-lg border px-3 py-2.5")}>
      <div className="text-muted-foreground/70 text-[10.5px] font-medium tracking-wider uppercase">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-[14px] font-semibold tracking-tight",
          textColor,
        )}
      >
        {verdictLabel(verdict)}
      </div>
    </div>
  );
}

function verdictLabel(v: AuthVerdict): string {
  switch (v) {
    case "pass":
      return "Pass";
    case "fail":
      return "Fail";
    case "softfail":
      return "Softfail";
    case "neutral":
      return "Neutral";
    case "none":
      return "None";
    case "unknown":
      return "Unknown";
  }
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

function LinksCard({ emailId }: { emailId: string }) {
  const { data, isLoading, error } = useLinkReport(emailId);

  return (
    <Card
      title="Links"
      subtitle="URL extraction + classification. No network checks."
      action={data ? <LinkCountsRow counts={data.counts} /> : null}
    >
      {isLoading && !data ? (
        <CardSkeleton rows={3} />
      ) : error ? (
        <CardError message={errorMessage(error)} />
      ) : data ? (
        data.links.length === 0 ? (
          <CardEmpty message="No links found in this email." />
        ) : (
          <LinksTable report={data} />
        )
      ) : null}
    </Card>
  );
}

function LinkCountsRow({ counts }: { counts: LinkReport["counts"] }) {
  const parts: string[] = [];
  parts.push(`${counts.total} total`);
  if (counts.insecureHttp > 0)
    parts.push(`${counts.insecureHttp} insecure`);
  if (counts.mailto > 0) parts.push(`${counts.mailto} mailto`);
  if (counts.tel > 0) parts.push(`${counts.tel} tel`);
  if (counts.trackingLikely > 0)
    parts.push(`${counts.trackingLikely} tracking`);
  return (
    <span className="text-muted-foreground text-[11px] tabular-nums">
      {parts.join(" · ")}
    </span>
  );
}

function LinksTable({ report }: { report: LinkReport }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <Th className="pl-4">URL</Th>
          <Th className="w-20">Kind</Th>
          <Th className="w-48">Warnings</Th>
        </TableRow>
      </TableHeader>
      <TableBody>
        {report.links.map((link, i) => (
          <TableRow key={`${link.url}-${i}`} className="hover:bg-transparent">
            <TableCell className="py-2 pl-4">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-foreground/80 inline-flex max-w-full items-center gap-1 truncate font-mono text-[11.5px]"
              >
                <span className="truncate">{link.url}</span>
                <ArrowSquareOutIcon
                  size={10}
                  weight="regular"
                  className="text-muted-foreground/70 shrink-0"
                />
              </a>
            </TableCell>
            <TableCell className="py-2">
              <span className="text-muted-foreground font-mono text-[11px] uppercase">
                {link.kind}
              </span>
            </TableCell>
            <TableCell className="py-2 pr-4">
              <div className="flex flex-wrap gap-1">
                {link.warnings.length === 0 ? (
                  <span className="text-muted-foreground/40 text-[11px]">—</span>
                ) : (
                  link.warnings.map((w) => (
                    <span
                      key={w}
                      className={cn(
                        "border-warn/40 bg-warn/10 text-warn",
                        "inline-flex h-5 items-center gap-1 rounded-md border px-1.5 text-[10.5px]",
                      )}
                    >
                      <WarningIcon size={10} weight="regular" />
                      {w}
                    </span>
                  ))
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ---------------------------------------------------------------------------
// List-Unsubscribe
// ---------------------------------------------------------------------------

function UnsubCard({ emailId }: { emailId: string }) {
  const { data, isLoading, error } = useUnsubReport(emailId);

  return (
    <Card
      title="List-Unsubscribe"
      subtitle="RFC 2369 / RFC 8058 one-click unsubscribe header check."
    >
      {isLoading && !data ? (
        <CardSkeleton rows={2} />
      ) : error ? (
        <CardError message={errorMessage(error)} />
      ) : data ? (
        <UnsubBody report={data} />
      ) : null}
    </Card>
  );
}

function UnsubBody({ report }: { report: UnsubReport }) {
  return (
    <div className="px-4 pb-4">
      <div className="flex flex-wrap gap-2">
        <UnsubBadge ok={report.present} label="Present" failLabel="Missing" />
        <UnsubBadge ok={report.valid} label="Valid syntax" failLabel="Invalid" />
        <UnsubBadge
          ok={report.oneClick}
          label="One-click"
          failLabel="No one-click"
          neutral={!report.present}
        />
      </div>

      {report.uris.length > 0 ? (
        <div className="mt-4">
          <div className="text-muted-foreground/70 mb-1.5 text-[10.5px] font-medium tracking-wider uppercase">
            URIs
          </div>
          <ul className="border-border/60 divide-border/60 divide-y rounded-lg border">
            {report.uris.map((u, i) => (
              <li
                key={`${u.raw}-${i}`}
                className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11.5px]"
              >
                <span className="text-muted-foreground uppercase">
                  {u.scheme}
                </span>
                <span className="text-foreground truncate">{u.raw}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.findings.length > 0 ? (
        <div className="mt-4">
          <div className="text-muted-foreground/70 mb-1.5 text-[10.5px] font-medium tracking-wider uppercase">
            Findings
          </div>
          <ul className="border-border/60 divide-border/60 divide-y rounded-lg border">
            {report.findings.map((f, i) => (
              <li
                key={`${f.rule}-${i}`}
                className="flex items-start gap-2.5 px-3 py-2"
              >
                <SeverityChip severity={f.severity} />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground font-mono text-[11px]">
                    {f.rule}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-[11.5px] leading-snug">
                    {f.message}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function UnsubBadge({
  ok,
  label,
  failLabel,
  neutral = false,
}: {
  ok: boolean;
  label: string;
  failLabel: string;
  neutral?: boolean;
}) {
  if (neutral) {
    return (
      <span className="border-border/60 bg-muted/40 text-muted-foreground inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-[11.5px]">
        <WarningCircleIcon size={11} weight="regular" />
        {failLabel}
      </span>
    );
  }
  return ok ? (
    <span className="border-success/30 bg-success/10 text-success inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-[11.5px]">
      <CheckCircleIcon size={11} weight="fill" />
      {label}
    </span>
  ) : (
    <span className="border-destructive/30 bg-destructive/10 text-destructive inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-[11.5px]">
      <XCircleIcon size={11} weight="fill" />
      {failLabel}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border/60 overflow-hidden rounded-xl border">
      <header className="border-border/60 flex items-start gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-[13px] font-semibold leading-none tracking-tight">
            {title}
          </h3>
          <p className="text-muted-foreground mt-1 text-[11.5px] leading-snug">
            {subtitle}
          </p>
        </div>
        {action ? <div className="shrink-0 self-center">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={cn(
        "text-muted-foreground/70 h-9 text-[10.5px] font-medium tracking-wider uppercase",
        className,
      )}
    >
      {children}
    </TableHead>
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

function SeverityChip({ severity }: { severity: string }) {
  const styles =
    severity === "error"
      ? "bg-destructive/12 text-destructive"
      : severity === "warning"
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

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Couldn't load report.";
}
