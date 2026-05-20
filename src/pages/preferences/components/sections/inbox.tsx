import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { IntField } from "@/components/int-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeferredCommit } from "@/hooks/use-deferred-commit";
import {
  usePreferencesStore,
  type InboxView,
} from "@/stores/use-preferences-store";
import {
  updateInboxPrefs,
  useBackendSettings,
  type InboxPrefs,
} from "@/services/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Row } from "../row";
import { Section } from "../section";

export function InboxSection() {
  const { settings } = useBackendSettings();
  const inbox = settings?.inbox;

  // defaultView is purely a render-time choice and has no engine
  // counterpart; it stays in the local zustand store. Everything else
  // round-trips through the engine.
  const defaultView = usePreferencesStore((s) => s.inbox.defaultView);
  const updateLocal = usePreferencesStore((s) => s.update);

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
      description="Defaults for how captured email is organized and retained."
    >
      <Row
        label="Default view"
        description="How emails are rendered when you open a mailbox."
        htmlFor="default-view"
        comingSoon
      >
        <Select
          value={defaultView}
          onValueChange={(v) =>
            updateLocal("inbox", { defaultView: v as InboxView })
          }
        >
          <SelectTrigger id="default-view" className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List</SelectItem>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="cards">Cards</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row
        label="Group related emails"
        description="Collapse same-recipient threads into a single row."
        htmlFor="thread-related"
        comingSoon
      >
        {inbox ? (
          <Switch
            id="thread-related"
            checked={inbox.threadRelated}
            onCheckedChange={(v) => commit({ threadRelated: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
      <Row
        label="Auto-tag emails"
        description="Detect auth, billing, marketing, and system mail locally."
        htmlFor="auto-tag"
        comingSoon
      >
        {inbox ? (
          <Switch
            id="auto-tag"
            checked={inbox.autoTag}
            onCheckedChange={(v) => commit({ autoTag: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
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
