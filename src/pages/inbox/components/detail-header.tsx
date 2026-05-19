import { exactDateTime } from "@/lib/time";
import { type EmailDetail } from "@/services/email";

import { shortTag } from "./tag-pill";

type Props = {
  email: EmailDetail;
};

/**
 * Top of the detail pane: subject, who/when/size, optional tag.
 * The toolbar (star/pin/delete/etc.) sits below the header — Step 6.
 */
export function DetailHeader({ email }: Props) {
  const subject = email.subject?.trim() || "(no subject)";

  return (
    <header className="border-border/60 flex flex-col gap-3 border-b px-6 pt-5 pb-4">
      <h1 className="text-foreground text-[17px] leading-tight font-semibold tracking-tight">
        {subject}
      </h1>

      <dl className="text-muted-foreground grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[12px]">
        <dt className="text-muted-foreground/70">From</dt>
        <dd className="text-foreground min-w-0 truncate">{email.from}</dd>

        <dt className="text-muted-foreground/70">To</dt>
        <dd className="text-foreground min-w-0 truncate">
          {email.to.join(", ")}
        </dd>

        <dt className="text-muted-foreground/70">Received</dt>
        <dd className="text-foreground tabular-nums">
          {exactDateTime(email.receivedAt)} · {formatBytes(email.sizeBytes)}
        </dd>

        {shortTag(email.tag) ? (
          <>
            <dt className="text-muted-foreground/70">Tag</dt>
            <dd>
              <span className="bg-muted text-muted-foreground inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium">
                {shortTag(email.tag)}
              </span>
            </dd>
          </>
        ) : null}
      </dl>
    </header>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
