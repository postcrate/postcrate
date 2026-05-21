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
      description="When postcrate looks for new versions."
    >
      <Row
        label="Check automatically"
        description="Check for updates once a day in the background."
        htmlFor="auto-check"
        comingSoon
      >
        <Switch
          id="auto-check"
          checked={u.autoCheck}
          onCheckedChange={(v) => update("updates", { autoCheck: v })}
        />
      </Row>
      <Row
        label="Channel"
        description="Stable for releases. Beta for early access."
        htmlFor="channel"
        comingSoon
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
      <Row
        label="Check now"
        description="Look for a new version right now."
        comingSoon
      >
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Check for updates
        </Button>
      </Row>
    </Section>
  );
}
