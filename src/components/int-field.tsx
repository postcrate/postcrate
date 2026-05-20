import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Props = {
  id?: string;
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

/**
 * Integer input that commits on blur (and Enter) rather than per
 * keystroke. Used for any backend-bound numeric pref so we don't fire
 * an IPC for every digit typed. Local "draft" state lets the user type
 * freely; the parent never sees intermediate values.
 */
export function IntField({
  id,
  value,
  onCommit,
  min,
  max,
  step = 1,
  className,
}: Props) {
  const [draft, setDraft] = useState(() => String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    let next = Math.floor(parsed);
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  return (
    <Input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      className={cn("h-8 w-24 text-right text-xs tabular-nums", className)}
    />
  );
}
