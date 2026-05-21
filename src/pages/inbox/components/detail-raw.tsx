import { cn } from "@/lib/utils";
import { useEmailRaw } from "@/services/email";
import { usePreferencesStore } from "@/stores/use-preferences-store";

type Props = {
  emailId: string;
};

/**
 * The RFC 5322 source. Fetched lazily — the parent tab gates this
 * component so we only hit the engine when the user actually clicks
 * the Raw tab. The hook treats the bytes as immutable.
 *
 * Font respects the appearance.monoForCode preference. Defaults to
 * monospace (right for source); flipping it off gives a proportional
 * font for users who find mono hard to read.
 */
export function DetailRaw({ emailId }: Props) {
  const { raw, isLoading, error } = useEmailRaw(emailId);
  const mono = usePreferencesStore((s) => s.appearance.monoForCode);

  if (isLoading && !raw) {
    return (
      <p className="text-muted-foreground px-6 py-5 text-[12.5px]">Loading…</p>
    );
  }
  if (error) {
    return (
      <p className="text-destructive px-6 py-5 text-[12.5px]">
        {error instanceof Error ? error.message : "Couldn't load the raw source"}
      </p>
    );
  }

  return (
    <pre
      className={cn(
        "text-foreground text-[12px] leading-relaxed whitespace-pre-wrap px-6 py-5",
        mono ? "font-mono" : "font-sans",
      )}
    >
      {raw ?? ""}
    </pre>
  );
}
