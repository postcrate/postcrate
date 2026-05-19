import { cn } from "@/lib/utils";

/**
 * The engine auto-classifies every captured email into one of six
 * fixed buckets (see `postcrate-core::tagging`). It also honors RFC
 * 5233 plus-addressing — `alice+invoices@example.com` produces a
 * free-form `"invoices"` tag that beats the heuristic.
 *
 * For the row pill we:
 *  - shorten the verbose engine strings (`transactional_notification`
 *    → `notification`) so the chip stays readable in the narrow list,
 *  - hide the catch-all `"unknown"` bucket entirely (the classifier
 *    deliberately overcounts uncertainty; rendering it adds noise),
 *  - pass free-form plus-tags through unchanged.
 */
const SHORT_LABEL: Record<string, string> = {
  transactional_auth: "auth",
  transactional_billing: "billing",
  transactional_notification: "notification",
  marketing: "marketing",
  system: "system",
};

export function shortTag(tag: string | null): string | null {
  if (!tag) return null;
  if (tag === "unknown") return null;
  return SHORT_LABEL[tag] ?? tag;
}

type Props = {
  tag: string | null;
  className?: string;
};

/**
 * Compact tag chip. Renders nothing for `null` or `"unknown"`.
 */
export function TagPill({ tag, className }: Props) {
  const label = shortTag(tag);
  if (!label) return null;
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
