import { cn } from "@/lib/utils";
import { useEmailSmtpTranscript } from "@/services/email";

type Props = {
  emailId: string;
};

/**
 * Per-email SMTP wire conversation, captured at ingest when the
 * `Preserve SMTP transcript` pref was on. Each line is one direction:
 *
 *   `> EHLO ...`   — client → server
 *   `< 250-...`    — server → client
 *
 * Credential frames (AUTH PLAIN / LOGIN base64 bodies) are scrubbed by
 * the engine before the snapshot reaches disk; the tab never sees them.
 *
 * The hook resolves to `null` for any email captured before the pref
 * was turned on. The parent gates the tab on that signal so users
 * don't see a confusing "no transcript" state on every old email.
 */
export function DetailTranscript({ emailId }: Props) {
  const { transcript, isLoading, error } = useEmailSmtpTranscript(emailId);

  if (isLoading && transcript === undefined) {
    return (
      <p className="text-muted-foreground px-6 py-5 text-[12.5px]">Loading…</p>
    );
  }
  if (error) {
    return (
      <p className="text-destructive px-6 py-5 text-[12.5px]">
        {error instanceof Error ? error.message : "Couldn't load the transcript"}
      </p>
    );
  }
  if (!transcript) {
    return (
      <p className="text-muted-foreground px-6 py-10 text-center text-[12.5px]">
        This message was captured before SMTP transcripts were turned on.
        Open Preferences → Advanced to capture future sessions.
      </p>
    );
  }

  return (
    <pre className="text-foreground px-6 py-5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
      {transcript.split("\n").map((line, i) => (
        <span
          key={i}
          className={cn(
            "block",
            line.startsWith("> ") && "text-foreground/90",
            line.startsWith("< ") && "text-muted-foreground",
            line.startsWith("> [redacted") && "text-warn",
          )}
        >
          {line}
        </span>
      ))}
    </pre>
  );
}
