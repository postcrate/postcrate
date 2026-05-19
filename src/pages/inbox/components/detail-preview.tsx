import { useMemo } from "react";

import { useTheme } from "@/hooks/use-theme";

type Props = {
  html: string;
};

/**
 * HTML body preview. Renders inside an iframe with an empty `sandbox`
 * attribute — no scripts, no top-navigation, no forms. Remote images
 * are allowed (product decision); add a "Block remote content" toggle
 * in Preferences as a follow-up.
 *
 * The composed shell carries a `data-theme` attribute on `<html>` and
 * minimal typography so the preview blends with the app surface.
 */
export function DetailPreview({ html }: Props) {
  const { resolved } = useTheme();
  const composed = useMemo(() => composeShell(html, resolved), [html, resolved]);

  return (
    <iframe
      title="HTML preview"
      className="h-full w-full border-0 bg-transparent"
      srcDoc={composed}
      sandbox=""
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
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
