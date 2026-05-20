import { MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/stores/use-preferences-store";

/**
 * Icon-only toggle that flips the email-body iframe between light and
 * dark *independently* of the app theme. Useful for auditing how an
 * email renders in the other mode without switching the whole UI.
 * Persists via the preferences store so it remembers across sessions.
 */
export function PreviewThemeToggle() {
  const theme = usePreferencesStore((s) => s.inbox.emailPreviewTheme);
  const update = usePreferencesStore((s) => s.update);
  const next = theme === "light" ? "dark" : "light";
  const Icon = theme === "light" ? SunIcon : MoonIcon;

  return (
    <button
      type="button"
      onClick={() => update("inbox", { emailPreviewTheme: next })}
      aria-label={`Preview is in ${theme} mode. Switch to ${next} mode.`}
      title={`Preview in ${theme} mode — click for ${next}`}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        "grid size-6 shrink-0 place-items-center rounded-md transition-colors",
      )}
    >
      <Icon size={13} weight="regular" />
    </button>
  );
}
