import { useEffect, useState } from "react";

/**
 * Track a controlled numeric input with a local draft that updates
 * instantly while a `commit` callback only fires when the caller says
 * so (typically on slider release or input blur).
 *
 * Use this for any controlled value whose persistence is expensive —
 * an IPC, a network call — so the UI stays responsive without firing
 * a write on every intermediate value.
 *
 * The draft re-syncs whenever the external `value` changes (e.g. the
 * engine echoes back a setting), so out-of-band updates don't get
 * clobbered by a stale local draft.
 */
export function useDeferredCommit(
  value: number,
  commit: (v: number) => void,
): {
  draft: number;
  setDraft: (v: number) => void;
  commitDraft: (v: number) => void;
} {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return {
    draft,
    setDraft,
    commitDraft: (v: number) => {
      setDraft(v);
      commit(v);
    },
  };
}
