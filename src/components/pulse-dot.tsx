import { cn } from "@/lib/utils";

type Tone = "success" | "warn" | "danger" | "info";

type Props = {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
};

const TONE: Record<Tone, string> = {
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
};

const RING: Record<Tone, string> = {
  success:
    "shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_25%,transparent)]",
  warn: "shadow-[0_0_0_3px_color-mix(in_oklch,var(--warn)_25%,transparent)]",
  danger:
    "shadow-[0_0_0_3px_color-mix(in_oklch,var(--danger)_25%,transparent)]",
  info: "shadow-[0_0_0_3px_color-mix(in_oklch,var(--info)_25%,transparent)]",
};

export function PulseDot({ tone = "success", pulse = true, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        TONE[tone],
        RING[tone],
        pulse && "motion-safe:animate-[pulse-soft_1.8s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}
