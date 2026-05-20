import { type EmailPreviewTheme } from "@/stores/use-preferences-store";

/**
 * Rewrite `(prefers-color-scheme: …)` media queries so the rules
 * matching `theme` activate unconditionally and the non-matching ones
 * never do. Lets us preview Apple-Mail-style dark mode (where the
 * email author's own opt-in rules drive the appearance) without
 * needing the user's OS to be in dark mode.
 *
 * Why this is acceptable manipulation: we don't invent any colors and
 * we don't change any property. We only choose which of the author's
 * own conditional blocks apply. The result is the same one the author
 * intended for a user on a real Apple Mail in that scheme.
 *
 * Swap technique: `(prefers-color-scheme: dark)` → `(min-width: 0px)`
 * for activation (always true) and `(min-width: 99999999px)` for
 * deactivation (never true). Preserves the rest of the media query —
 * `screen and (prefers-color-scheme: dark) and (min-width: 600px)`
 * stays an `and`-chain, just with one condition swapped.
 *
 * Returns the rewritten HTML plus a count for UI surfacing.
 */
export function forceColorScheme(
  html: string,
  theme: EmailPreviewTheme,
): { html: string; rewritten: number } {
  const inactive = theme === "dark" ? "light" : "dark";

  let rewritten = 0;

  const activatePattern = new RegExp(
    `\\(\\s*prefers-color-scheme\\s*:\\s*${theme}\\s*\\)`,
    "gi",
  );
  const deactivatePattern = new RegExp(
    `\\(\\s*prefers-color-scheme\\s*:\\s*${inactive}\\s*\\)`,
    "gi",
  );

  let out = html.replace(activatePattern, () => {
    rewritten++;
    return "(min-width: 0px)";
  });
  out = out.replace(deactivatePattern, () => {
    rewritten++;
    return "(min-width: 99999999px)";
  });

  return { html: out, rewritten };
}
