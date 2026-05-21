import { useEffect, useRef, useState } from "react";
import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { setEmailNote } from "@/services/email";
import { reportIpcError } from "@/lib/bridge/ipc";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  emailId: string;
  initialNote: string | null;
};

const SAVE_DEBOUNCE_MS = 400;

/**
 * Per-email note: collapsible textarea at the bottom of the detail
 * pane. Saves after 400ms of idle typing; also flushes on blur and
 * when the user switches to another email.
 */
export function DetailNote({ emailId, initialNote }: Props) {
  const [draft, setDraft] = useState(initialNote ?? "");
  const [expanded, setExpanded] = useState((initialNote ?? "").length > 0);
  const savedRef = useRef(initialNote ?? "");
  const timerRef = useRef<number | null>(null);
  const flushRef = useRef<() => Promise<void>>(async () => undefined);

  // Reset state when switching emails. Flush any pending save first
  // so we don't drop the previous email's edit.
  useEffect(() => {
    flushRef.current().finally(() => {
      setDraft(initialNote ?? "");
      setExpanded((initialNote ?? "").length > 0);
      savedRef.current = initialNote ?? "";
    });
  }, [emailId, initialNote]);

  // Keep the flush ref pointing at a closure that captures the latest
  // draft so cleanup paths always save the freshest value.
  flushRef.current = async function flush() {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const id = emailId;
    const value = draft;
    if (value === savedRef.current) return;
    try {
      await setEmailNote(id, value.length === 0 ? null : value);
      savedRef.current = value;
    } catch (err) {
      reportIpcError(err, "Couldn't save note");
    }
  };

  // Debounced auto-save on every keystroke.
  useEffect(() => {
    if (draft === savedRef.current) return;
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      flushRef.current();
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [draft]);

  // Final flush on unmount so closing the window doesn't drop a note.
  useEffect(() => {
    return () => {
      flushRef.current();
    };
  }, []);

  if (!expanded) {
    return (
      <div className="border-border/60 flex justify-start border-t px-6 py-3">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-[12px] transition-colors"
        >
          <NotePencilIcon size={12} weight="regular" />
          Add a note
        </button>
      </div>
    );
  }

  return (
    <div className="border-border/60 border-t px-6 py-3">
      <label className="text-muted-foreground/70 mb-1.5 block text-[10.5px] font-medium tracking-wider uppercase">
        Note
      </label>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={() => flushRef.current()}
        placeholder="Jot down anything you want to remember about this message…"
        rows={3}
        className={cn(
          "border-border/60 bg-card/30 text-[12.5px] leading-relaxed",
          "placeholder:text-muted-foreground/60",
        )}
      />
    </div>
  );
}
