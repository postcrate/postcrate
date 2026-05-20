import { toast } from "sonner";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr";

import type { JsonValue } from "@/lib/bridge/bindings";

type Props = {
  headers: JsonValue;
  messageId: string | null;
  inReplyTo: string | null;
};

/**
 * Renderer for the email's header tree. Pinned at the top is an
 * "Identity" block surfacing `Message-ID` / `In-Reply-To` (the
 * fields the engine extracts into typed columns) so threading info is
 * one-glance discoverable. Below it, the raw header JSON walks any
 * `serde_json::Value` and renders leaves as monospace.
 */
export function DetailHeaders({ headers, messageId, inReplyTo }: Props) {
  const hasIdentity = messageId !== null || inReplyTo !== null;

  return (
    <div className="space-y-5 px-6 py-5">
      {hasIdentity ? (
        <section>
          <h3 className="text-muted-foreground/70 mb-2 text-[10.5px] font-medium tracking-wider uppercase">
            Identity
          </h3>
          <dl className="border-border/60 divide-border/60 divide-y rounded-lg border">
            {messageId ? (
              <IdentityRow label="Message-ID" value={messageId} />
            ) : null}
            {inReplyTo ? (
              <IdentityRow label="In-Reply-To" value={inReplyTo} />
            ) : null}
          </dl>
        </section>
      ) : null}

      <section>
        {hasIdentity ? (
          <h3 className="text-muted-foreground/70 mb-2 text-[10.5px] font-medium tracking-wider uppercase">
            All headers
          </h3>
        ) : null}
        <Node value={headers} />
      </section>
    </div>
  );
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }
  return (
    <div className="group flex items-start gap-3 px-3 py-2">
      <dt className="text-muted-foreground/70 w-24 shrink-0 pt-px font-mono text-[11px]">
        {label}
      </dt>
      <dd className="text-foreground min-w-0 flex-1 font-mono text-[12px] break-all">
        {value}
      </dd>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="text-muted-foreground hover:text-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <CopyIcon size={11} weight="regular" />
      </button>
    </div>
  );
}

function Node({ value, depth = 0 }: { value: JsonValue; depth?: number }) {
  if (value === null) return <Leaf>null</Leaf>;
  if (typeof value === "string") return <Leaf>{value}</Leaf>;
  if (typeof value === "number" || typeof value === "boolean") {
    return <Leaf>{String(value)}</Leaf>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <Leaf>[]</Leaf>;
    return (
      <ul className="space-y-1">
        {value.map((entry, i) => (
          <li
            key={i}
            className="border-border/50 border-l pl-3"
            style={{ marginLeft: depth === 0 ? 0 : 4 }}
          >
            <Node value={entry as JsonValue} depth={depth + 1} />
          </li>
        ))}
      </ul>
    );
  }
  const entries = Object.entries(value as Record<string, JsonValue>);
  if (entries.length === 0) return <Leaf>{"{}"}</Leaf>;
  return (
    <dl className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1"
        >
          <dt className="text-muted-foreground/70 pt-px font-mono text-[11.5px]">
            {k}
          </dt>
          <dd className="min-w-0">
            <Node value={v} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Leaf({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-foreground font-mono text-[12px] break-all">
      {children}
    </span>
  );
}
