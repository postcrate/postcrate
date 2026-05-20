import { useMemo } from "react";

import { usePreferencesStore } from "@/stores/use-preferences-store";

import { composePreviewShell } from "./preview-shell";

type Props = {
  html: string;
};

/**
 * HTML body preview. Renders inside an iframe with an empty `sandbox`
 * attribute — no scripts, no top-navigation, no forms. Remote images
 * are allowed (product decision); add a "Block remote content" toggle
 * in Preferences as a follow-up.
 *
 * The theme comes from the email-preview override in preferences (not
 * the app theme), so users can audit the other mode without flipping
 * their whole UI.
 */
export function DetailPreview({ html }: Props) {
  const theme = usePreferencesStore((s) => s.inbox.emailPreviewTheme);
  const composed = useMemo(
    () => composePreviewShell(html, theme),
    [html, theme],
  );

  return (
    <iframe
      title="HTML preview"
      className="h-full w-full border-0"
      srcDoc={composed}
      sandbox=""
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}
