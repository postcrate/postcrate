import type { JsonValue } from "@/lib/bridge/bindings";

type Props = {
  headers: JsonValue;
};

/**
 * Recursive renderer for the email's header tree. The engine returns
 * `JsonValue` (a `serde_json::Value`), so we walk arrays + objects and
 * render leaves as monospace text.
 */
export function DetailHeaders({ headers }: Props) {
  return (
    <div className="px-6 py-5">
      <Node value={headers} />
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
