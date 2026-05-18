import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { type Mailbox } from "@/services/mailbox";

type Props = {
  mailboxes: Mailbox[];
};

export function StatsGrid({ mailboxes }: Props) {
  const breakdown = useMemo(() => {
    const c = { primary: 0, shared: 0, ephemeral: 0 };
    for (const m of mailboxes) c[m.kind]++;
    return c;
  }, [mailboxes]);

  const totalMail = useMemo(
    () => mailboxes.reduce((acc, m) => acc + m.count, 0),
    [mailboxes],
  );

  const lastMailbox = useMemo(() => {
    return [...mailboxes]
      .filter((m) => m.count > 0)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [mailboxes]);

  const ephemeralCount = breakdown.ephemeral;
  const parallelWorkers = Math.max(ephemeralCount, 0);
  const allHealthy = mailboxes.every((m) => !m.failed);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        label="Active mailboxes"
        value={mailboxes.length.toString()}
        sub={
          mailboxes.length === 0
            ? "Create one to get started"
            : describeBreakdown(breakdown)
        }
      />
      <StatCard
        label="Captured today"
        value={totalMail.toLocaleString()}
        sub={
          lastMailbox
            ? `last in ${lastMailbox.name} · ${formatTime(lastMailbox.createdAt)}`
            : "nothing captured yet"
        }
      />
      <StatCard
        label="Parallel test workers"
        value={parallelWorkers.toString()}
        valueClassName={parallelWorkers > 0 ? "text-success" : undefined}
        sub={
          parallelWorkers === 0
            ? "no ephemeral mailboxes"
            : allHealthy
              ? "all healthy"
              : "some listeners failed"
        }
        subClassName={!allHealthy ? "text-destructive" : undefined}
      />
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  valueClassName?: string;
  subClassName?: string;
};

function StatCard({
  label,
  value,
  sub,
  valueClassName,
  subClassName,
}: StatCardProps) {
  return (
    <div className="border-border/60 bg-card/30 flex flex-col gap-2 rounded-xl border px-4 py-3.5">
      <div className="text-muted-foreground/70 text-[10.5px] font-medium tracking-wider uppercase">
        {label}
      </div>
      <div
        className={cn(
          "text-foreground font-semibold tracking-tight tabular-nums",
          "text-[28px] leading-none",
          valueClassName,
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "text-muted-foreground text-[11.5px] leading-snug",
          subClassName,
        )}
      >
        {sub}
      </div>
    </div>
  );
}

function describeBreakdown(c: {
  primary: number;
  shared: number;
  ephemeral: number;
}): string {
  const parts: string[] = [];
  if (c.ephemeral) parts.push(`${c.ephemeral} ephemeral`);
  if (c.shared) parts.push(`${c.shared} named`);
  if (c.primary) parts.push(`${c.primary} primary`);
  return parts.join(" · ");
}

function formatTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => n.toString().padStart(2, "0"))
    .join(":");
}
