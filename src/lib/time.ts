/**
 * Time formatting helpers built on the platform's `Intl` APIs.
 *
 * No date library — `Intl.RelativeTimeFormat` and `Date.toLocaleString`
 * cover every case we have. Locale is picked up from the browser; pass
 * an explicit one to override.
 */

type Unit = Intl.RelativeTimeFormatUnit;

const UNIT_THRESHOLDS: ReadonlyArray<readonly [Unit, number]> = [
  ["year", 365 * 86_400_000],
  ["month", 30 * 86_400_000],
  ["week", 7 * 86_400_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1_000],
];

const formatterCache = new Map<string, Intl.RelativeTimeFormat>();

function relativeFormatter(
  locale: string | undefined,
  style: Intl.RelativeTimeFormatStyle,
): Intl.RelativeTimeFormat {
  const key = `${locale ?? ""}|${style}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style });
    formatterCache.set(key, f);
  }
  return f;
}

/**
 * "2m ago", "1h ago", "yesterday", "in 3d". Uses the narrow style so
 * the output fits in tight inbox rows. `numeric: "auto"` produces
 * idiomatic strings ("yesterday", "now") instead of bare counts.
 */
export function relativeTime(
  timestampMs: number,
  options: { now?: number; locale?: string; style?: Intl.RelativeTimeFormatStyle } = {},
): string {
  const { now = Date.now(), locale, style = "narrow" } = options;
  const diff = timestampMs - now;
  const f = relativeFormatter(locale, style);

  for (const [unit, scale] of UNIT_THRESHOLDS) {
    if (Math.abs(diff) >= scale) {
      return f.format(Math.round(diff / scale), unit);
    }
  }
  return f.format(0, "second");
}

/**
 * "Mon, Feb 12, 13:45" — used in email detail headers where exact
 * time is required. Pass `withYear: true` for messages > 1 year old.
 */
export function exactDateTime(
  timestampMs: number,
  options: { locale?: string; withYear?: boolean } = {},
): string {
  const { locale, withYear = false } = options;
  return new Date(timestampMs).toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

/** True if the timestamp falls on the local calendar day as `now`. */
export function isSameDay(timestampMs: number, now = Date.now()): boolean {
  const a = new Date(timestampMs);
  const b = new Date(now);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * "13:45" if today, otherwise "Feb 12". Useful for the email-list row
 * where the same column shows time-of-day for recent mail and date
 * for older mail (Apple Mail / Gmail convention).
 */
export function listColumnTime(timestampMs: number, locale?: string): string {
  if (isSameDay(timestampMs)) {
    return new Date(timestampMs).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return new Date(timestampMs).toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
  });
}
