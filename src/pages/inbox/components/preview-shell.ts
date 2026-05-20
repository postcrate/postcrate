import { type EmailPreviewTheme } from "@/stores/use-preferences-store";

/**
 * Wraps an email's HTML body in a minimal document. Three things only:
 *
 *   1. A valid HTML envelope and `<base target="_blank">` so links open
 *      externally instead of inside the sandboxed iframe.
 *   2. Paint the canvas (html + body background) to the toggled theme.
 *   3. Signal `color-scheme` to the UA so default form controls,
 *      scrollbars, and unstyled text inherit the right scheme. This is
 *      canvas-level metadata — it does NOT trigger the email's
 *      `@media (prefers-color-scheme: dark)` rules. That's a separate
 *      concern handled by the Render tab's per-profile rewrites.
 *
 * Deliberately does NOT inject font, color, link, image, or table
 * styles. The whole point of the preview is to render the email as its
 * author shipped it.
 *
 * Dark canvas matches the app's own `.dark --background` token.
 */
export function composePreviewShell(
  body: string,
  theme: EmailPreviewTheme,
): string {
  const bg =
    theme === "dark" ? "oklch(0.147 0.004 49.25)" : "oklch(1 0 0)";

  return `<!doctype html><html data-theme="${theme}"><head>
<meta charset="utf-8">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="${theme}">
<meta name="supported-color-schemes" content="light dark">
<base target="_blank">
<style>html,body{margin:0;background:${bg};color-scheme:${theme}}</style>
</head><body>${body}</body></html>`;
}
