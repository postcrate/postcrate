import {
  FileIcon,
  FileImageIcon,
  FilePdfIcon,
  FileTextIcon,
  FileZipIcon,
} from "@phosphor-icons/react/dist/ssr";

import { attachmentUrl } from "@/lib/attachment";
import { type AttachmentMeta } from "@/services/email";

type Props = {
  emailId: string;
  attachments: AttachmentMeta[];
};

/**
 * Strip of attachment chips below the header. Each chip is an anchor
 * pointing at the `attachment://` URI scheme — the webview streams the
 * bytes straight from the engine without base64 round-tripping.
 */
export function DetailAttachments({ emailId, attachments }: Props) {
  if (attachments.length === 0) return null;

  return (
    <ul className="border-border/60 flex flex-wrap gap-2 border-b px-6 py-3">
      {attachments.map((a) => (
        <li key={a.id}>
          <a
            href={attachmentUrl(emailId, a.id)}
            download={a.filename ?? undefined}
            className="border-border/60 bg-card/40 hover:bg-muted/60 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors"
          >
            <Glyph contentType={a.contentType} />
            <span className="flex min-w-0 flex-col">
              <span className="text-foreground truncate text-[12px] font-medium">
                {a.filename ?? "Untitled"}
              </span>
              <span className="text-muted-foreground/80 text-[10.5px] tabular-nums">
                {formatBytes(a.sizeBytes)}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Glyph({ contentType }: { contentType: string | null }) {
  const type = (contentType ?? "").toLowerCase();
  const Icon =
    type.startsWith("image/")
      ? FileImageIcon
      : type === "application/pdf"
        ? FilePdfIcon
        : type.startsWith("text/")
          ? FileTextIcon
          : type.includes("zip") || type.includes("compressed")
            ? FileZipIcon
            : FileIcon;
  return (
    <Icon size={14} weight="regular" className="text-muted-foreground shrink-0" />
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
