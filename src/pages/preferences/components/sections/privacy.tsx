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
      description="Postcrate runs locally. No telemetry, ever."
    >
      <Row
        label="Spam scoring"
        description="Show a local spam score in the Inspect tab. No DNS or RBL lookups."
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
        description="Show extracted links in the Inspect tab. Parsing only, no network requests."
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
        description="Show contrast, alt text, and structure findings in the Render tab."
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
        description="None. The app has no telemetry code."
      >
        <Badge variant="outline" className="text-[10px]">
          Always off
        </Badge>
      </Row>
    </Section>
  );
}
