import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  usePreferencesStore,
  type Density,
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

export function AppearanceSection() {
  const { density, monoForCode } = usePreferencesStore((s) => s.appearance);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Appearance"
      description="How postcrate looks on your machine."
    >
      <Row label="Theme" description="Light, dark, or follow the system.">
        <ThemeToggle />
      </Row>
      <Row
        label="Density"
        description="Spacing between rows in the inbox and lists."
        htmlFor="density"
        comingSoon
      >
        <Select
          value={density}
          onValueChange={(v) => update("appearance", { density: v as Density })}
        >
          <SelectTrigger id="density" className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comfortable">Comfortable</SelectItem>
            <SelectItem value="compact">Compact</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row
        label="Mono font for code"
        description="Use a monospace font for raw email source and headers."
        htmlFor="mono-code"
        comingSoon
      >
        <Switch
          id="mono-code"
          checked={monoForCode}
          onCheckedChange={(v) => update("appearance", { monoForCode: v })}
        />
      </Row>
    </Section>
  );
}
