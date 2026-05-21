import { useEffect, useState } from "react";
import { LightningIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { type Mailbox } from "@/services/mailbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHAOS_DEFAULTS,
  setChaos,
  useChaos,
  type ChaosConfig,
} from "@/services/chaos";

type Props = {
  mailbox: Mailbox;
};

const MAX_DELAY_MS = 1000;

/**
 * Per-mailbox chaos config. Master toggle gates fault injection; each
 * knob below tunes a specific failure mode. Mutations are optimistic
 * so dragging a slider feels native — failures revert via the service
 * `setChaos` catch.
 */
export function ChaosModeCard({ mailbox }: Props) {
  const { chaos, isLoading } = useChaos(mailbox.id);

  // Local "draft" copy lets sliders feel native — they paint locally
  // on every `onValueChange` but only fire an IPC on release
  // (`onValueCommit`). Without this split, dragging emitted hundreds
  // of `setChaos` calls per second; the matching cache invalidations
  // visibly blinked the sidebar mailbox switcher.
  const [draft, setDraft] = useState<ChaosConfig>({ ...CHAOS_DEFAULTS });
  useEffect(() => {
    if (chaos) setDraft({ ...CHAOS_DEFAULTS, ...chaos });
  }, [chaos]);

  function preview(next: ChaosConfig) {
    setDraft(next);
  }

  function commit(next: ChaosConfig) {
    setDraft(next);
    setChaos(mailbox.id, next).catch((err) =>
      reportIpcError(err, "Couldn't update chaos settings"),
    );
  }

  if (isLoading && !chaos) {
    return (
      <section className="border-border/60 rounded-xl border p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-5 w-10 rounded-full" />
        </div>
        <div className="mt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-2 w-full" />
          ))}
        </div>
      </section>
    );
  }

  const enabled = draft.enabled ?? false;
  const percent = (n: number | undefined) => Math.round((n ?? 0) * 100);

  return (
    <section className="border-border/60 overflow-hidden rounded-xl border">
      <header className="border-border/60 flex items-center gap-3 border-b px-4 py-3">
        <span
          aria-hidden
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md",
            enabled
              ? "bg-warn/15 text-warn"
              : "bg-muted text-muted-foreground/70",
          )}
        >
          <LightningIcon size={13} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground text-[13.5px] font-semibold leading-none tracking-tight">
            Chaos mode
          </h2>
          <p className="text-muted-foreground mt-1 truncate text-[11.5px]">
            Random delays, rejections, and drops on{" "}
            <span className="font-mono">{mailbox.name}</span>{" "}
            <span className="font-mono">:{mailbox.port}</span>
          </p>
        </div>
        <Switch
          aria-label="Toggle chaos mode"
          checked={enabled}
          onCheckedChange={(v) => commit({ ...draft, enabled: v })}
        />
      </header>

      <div
        className={cn(
          "px-5 py-4 transition-opacity",
          !enabled && "opacity-60",
        )}
      >
        <div className="flex flex-col gap-5">
          <SliderRow
            label="Random 4xx rejections"
            value={percent(draft.reject4XxProb)}
            valueLabel={`${percent(draft.reject4XxProb)}%`}
            valueClassName="text-warn"
            max={100}
            disabled={!enabled}
            onPreview={(p) => preview({ ...draft, reject4XxProb: p / 100 })}
            onCommit={(p) => commit({ ...draft, reject4XxProb: p / 100 })}
          />
          <SliderRow
            label="Random 5xx rejections"
            value={percent(draft.reject5XxProb)}
            valueLabel={`${percent(draft.reject5XxProb)}%`}
            valueClassName="text-destructive"
            max={100}
            disabled={!enabled}
            onPreview={(p) => preview({ ...draft, reject5XxProb: p / 100 })}
            onCommit={(p) => commit({ ...draft, reject5XxProb: p / 100 })}
          />
          <SliderRow
            label="Added response delay"
            value={draft.delayMsMax ?? 0}
            valueLabel={`${draft.delayMsMax ?? 0}ms`}
            valueClassName="text-info"
            max={MAX_DELAY_MS}
            step={10}
            disabled={!enabled}
            onPreview={(ms) =>
              preview({ ...draft, delayMsMin: 0, delayMsMax: ms })
            }
            onCommit={(ms) =>
              commit({ ...draft, delayMsMin: 0, delayMsMax: ms })
            }
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleTile
            label="Drop connection mid-DATA"
            description="Hang up after the client starts sending the message body."
            checked={(draft.dropDuringDataProb ?? 0) > 0}
            disabled={!enabled}
            onCheckedChange={(v) =>
              commit({ ...draft, dropDuringDataProb: v ? 1 : 0 })
            }
          />
          <ToggleTile
            label="Send malformed SMTP response"
            description="Reply with bytes that break the SMTP grammar."
            checked={(draft.malformedRespProb ?? 0) > 0}
            disabled={!enabled}
            onCheckedChange={(v) =>
              commit({ ...draft, malformedRespProb: v ? 1 : 0 })
            }
          />
        </div>

        <div className="border-warn/40 bg-warn/10 mt-5 flex items-start gap-2.5 rounded-lg border px-3 py-2.5">
          <WarningIcon
            size={13}
            weight="regular"
            className="text-warn mt-0.5 shrink-0"
          />
          <p className="text-warn/90 text-[11.5px] leading-snug">
            Chaos mode stays on per mailbox. The inbox shows a banner while
            it&apos;s active so you don&apos;t forget.
          </p>
        </div>
      </div>
    </section>
  );
}

type SliderRowProps = {
  label: string;
  value: number;
  valueLabel: string;
  valueClassName?: string;
  max: number;
  step?: number;
  disabled?: boolean;
  /** Fires continuously while dragging — local-only paint. */
  onPreview: (v: number) => void;
  /** Fires once on release — persists to the engine. */
  onCommit: (v: number) => void;
};

function SliderRow({
  label,
  value,
  valueLabel,
  valueClassName,
  max,
  step = 1,
  disabled = false,
  onPreview,
  onCommit,
}: SliderRowProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-foreground text-[12.5px] font-medium">
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-[11.5px] tabular-nums",
            valueClassName ?? "text-muted-foreground",
          )}
        >
          {valueLabel}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onPreview(v ?? 0)}
        onValueCommit={([v]) => onCommit(v ?? 0)}
        min={0}
        max={max}
        step={step}
        disabled={disabled}
      />
    </div>
  );
}

type ToggleTileProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (v: boolean) => void;
};

function ToggleTile({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: ToggleTileProps) {
  return (
    <label
      className={cn(
        "border-border/60 bg-muted/20 flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5",
        disabled && "cursor-not-allowed opacity-70",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-[12.5px] font-medium">
          {label}
        </span>
        <span className="text-muted-foreground mt-0.5 block text-[11.5px] leading-snug">
          {description}
        </span>
      </span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </label>
  );
}
