import { useEmailRaw } from "@/services/email";

type Props = {
  emailId: string;
};

/**
 * The RFC 5322 source. Fetched lazily — the parent tab gates this
 * component so we only hit the engine when the user actually clicks
 * the Raw tab. The hook treats the bytes as immutable.
 */
export function DetailRaw({ emailId }: Props) {
  const { raw, isLoading, error } = useEmailRaw(emailId);

  if (isLoading && !raw) {
    return (
      <p className="text-muted-foreground px-6 py-5 text-[12.5px]">Loading…</p>
    );
  }
  if (error) {
    return (
      <p className="text-destructive px-6 py-5 text-[12.5px]">
        {error instanceof Error ? error.message : "Couldn't load raw source"}
      </p>
    );
  }

  return (
    <pre className="text-foreground font-mono text-[12px] leading-relaxed whitespace-pre-wrap px-6 py-5">
      {raw ?? ""}
    </pre>
  );
}
