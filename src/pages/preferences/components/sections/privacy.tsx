import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from "@/stores/use-preferences-store";

import { Row } from "../row";
import { Section } from "../section";

export function PrivacySection() {
  const p = usePreferencesStore((s) => s.privacy);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Privacy"
      description="postcrate is local-by-default. Telemetry is never collected."
    >
      <Row
        label="Spam scoring"
        description="Show the local-heuristic spam score in the Inspect tab. No DNS or RBL lookups."
        htmlFor="spam-scoring"
      >
        <Switch
          id="spam-scoring"
          checked={p.enableSpamScoring}
          onCheckedChange={(v) => update("privacy", { enableSpamScoring: v })}
        />
      </Row>
      <Row
        label="Link checking"
        description="Show the extracted-links report in the Inspect tab. Parsing only — no network requests."
        htmlFor="link-checking"
      >
        <Switch
          id="link-checking"
          checked={p.enableLinkChecking}
          onCheckedChange={(v) =>
            update("privacy", { enableLinkChecking: v })
          }
        />
      </Row>
      <Row
        label="Accessibility checks"
        description="Show the a11y findings (contrast, alt text, semantic structure) in the Render tab."
        htmlFor="a11y-checks"
      >
        <Switch
          id="a11y-checks"
          checked={p.enableA11yChecking}
          onCheckedChange={(v) => update("privacy", { enableA11yChecking: v })}
        />
      </Row>
      <Row
        label="Telemetry"
        description="postcrate does not collect telemetry. This is enforced at the source."
      >
        <Badge variant="outline" className="text-[10px]">
          Always off
        </Badge>
      </Row>
    </Section>
  );
}
