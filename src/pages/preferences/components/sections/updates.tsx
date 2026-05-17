import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  usePreferencesStore,
  type UpdateChannel,
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

export function UpdatesSection() {
  const u = usePreferencesStore((s) => s.updates);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Updates"
      description="How and when postcrate looks for new versions."
    >
      <Row
        label="Check automatically"
        description="Look for updates in the background once a day."
        htmlFor="auto-check"
      >
        <Switch
          id="auto-check"
          checked={u.autoCheck}
          onCheckedChange={(v) => update("updates", { autoCheck: v })}
        />
      </Row>
      <Row
        label="Channel"
        description="Stable for release builds, beta for early access."
        htmlFor="channel"
      >
        <Select
          value={u.channel}
          onValueChange={(v) =>
            update("updates", { channel: v as UpdateChannel })
          }
        >
          <SelectTrigger id="channel" className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row label="Check now" description="Manually look for a new version.">
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Check for updates
        </Button>
      </Row>
    </Section>
  );
}
