import { Slider } from "@/components/ui/slider";
import { reportIpcError } from "@/lib/bridge/ipc";
import { IntField } from "@/components/int-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeferredCommit } from "@/hooks/use-deferred-commit";
import {
  updateInboxPrefs,
  useBackendSettings,
  type InboxPrefs,
} from "@/services/settings";

import { Row } from "../row";
import { Section } from "../section";

export function InboxSection() {
  const { settings } = useBackendSettings();
  const inbox = settings?.inbox;

  function commit(patch: Partial<InboxPrefs>) {
    if (!inbox) return;
    updateInboxPrefs({ ...inbox, ...patch }).catch((err) =>
      reportIpcError(err, "Couldn't update inbox settings"),
    );
  }

  // Auto-clear slider commits on release only, so dragging doesn't
  // fire one IPC per step.
  const autoClear = useDeferredCommit(
    inbox?.autoClearAfterDays ?? 0,
    (v) => commit({ autoClearAfterDays: v }),
  );

  return (
    <Section
      title="Inbox"
      description="How long captured email is retained before it's pruned automatically."
    >
      <Row
        label="Max retained emails"
        description="Older emails are pruned when this limit is exceeded."
        htmlFor="max-retained"
      >
        {inbox ? (
          <IntField
            id="max-retained"
            value={inbox.maxRetainedEmails}
            onCommit={(n) => commit({ maxRetainedEmails: n })}
            min={100}
            step={100}
          />
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </Row>
      <Row
        label="Auto-clear after"
        description={
          inbox
            ? `Currently set to ${autoClear.draft} days. Set to 0 to disable.`
            : "Days to retain captured email."
        }
      >
        {inbox ? (
          <div className="flex w-56 items-center gap-3">
            <Slider
              value={[autoClear.draft]}
              onValueChange={([v]) => autoClear.setDraft(v ?? 0)}
              onValueCommit={([v]) => autoClear.commitDraft(v ?? 0)}
              min={0}
              max={90}
              step={1}
              className="flex-1"
            />
            <span className="text-muted-foreground w-12 text-right text-[11px] tabular-nums">
              {autoClear.draft}d
            </span>
          </div>
        ) : (
          <Skeleton className="h-2 w-56" />
        )}
      </Row>
    </Section>
  );
}
