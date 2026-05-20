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
        description="Score captured emails against SpamAssassin-equivalent heuristics. Runs locally."
        htmlFor="spam-scoring"
        comingSoon
      >
        <Switch
          id="spam-scoring"
          checked={p.enableSpamScoring}
          onCheckedChange={(v) => update("privacy", { enableSpamScoring: v })}
        />
      </Row>
      <Row
        label="Link checking"
        description="Verify links in captured emails. Makes HEAD requests to remote hosts."
        htmlFor="link-checking"
        comingSoon
      >
        <div className="flex items-center gap-2">
          {p.enableLinkChecking && (
            <Badge variant="secondary" className="text-[10px]">
              Network
            </Badge>
          )}
          <Switch
            id="link-checking"
            checked={p.enableLinkChecking}
            onCheckedChange={(v) =>
              update("privacy", { enableLinkChecking: v })
            }
          />
        </div>
      </Row>
      <Row
        label="Accessibility checks"
        description="Lint emails for color contrast, alt text, and semantic structure."
        htmlFor="a11y-checks"
        comingSoon
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
