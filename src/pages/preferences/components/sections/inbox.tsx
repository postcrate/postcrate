import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  usePreferencesStore,
  type InboxView,
} from "@/stores/use-preferences-store";
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
  const inbox = usePreferencesStore((s) => s.inbox);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Inbox"
      description="Defaults for how captured email is organized and retained."
    >
      <Row
        label="Default view"
        description="How emails are rendered when you open a mailbox."
        htmlFor="default-view"
      >
        <Select
          value={inbox.defaultView}
          onValueChange={(v) =>
            update("inbox", { defaultView: v as InboxView })
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
      >
        <Switch
          id="thread-related"
          checked={inbox.threadRelated}
          onCheckedChange={(v) => update("inbox", { threadRelated: v })}
        />
      </Row>
      <Row
        label="Auto-tag emails"
        description="Detect auth, billing, marketing, and system mail locally."
        htmlFor="auto-tag"
      >
        <Switch
          id="auto-tag"
          checked={inbox.autoTag}
          onCheckedChange={(v) => update("inbox", { autoTag: v })}
        />
      </Row>
      <Row
        label="Max retained emails"
        description="Older emails are pruned when this limit is exceeded."
        htmlFor="max-retained"
      >
        <Input
          id="max-retained"
          type="number"
          min={100}
          step={100}
          value={inbox.maxRetainedEmails}
          onChange={(e) =>
            update("inbox", {
              maxRetainedEmails: Number(e.currentTarget.value) || 0,
            })
          }
          className="h-8 w-24 text-right text-xs tabular-nums"
        />
      </Row>
      <Row
        label="Auto-clear after"
        description={`Currently set to ${inbox.autoClearAfterDays} days. Set to 0 to disable.`}
      >
        <div className="flex w-56 items-center gap-3">
          <Slider
            value={[inbox.autoClearAfterDays]}
            onValueChange={([v]) =>
              update("inbox", { autoClearAfterDays: v ?? 0 })
            }
            min={0}
            max={90}
            step={1}
            className="flex-1"
          />
          <span className="text-muted-foreground w-12 text-right text-[11px] tabular-nums">
            {inbox.autoClearAfterDays}d
          </span>
        </div>
      </Row>
    </Section>
  );
}
