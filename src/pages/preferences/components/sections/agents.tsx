import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from "@/stores/use-preferences-store";

import { Row } from "../row";
import { Section } from "../section";

export function AgentsSection() {
  const ai = usePreferencesStore((s) => s.agents);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="AI & Agents"
      description="Behavior of the MCP server and how agents interact with the inbox."
    >
      <Row
        label="Default wait timeout"
        description={`wait_for_email blocks up to ${ai.defaultWaitTimeoutSeconds}s by default.`}
      >
        <div className="flex w-56 items-center gap-3">
          <Slider
            value={[ai.defaultWaitTimeoutSeconds]}
            onValueChange={([v]) =>
              update("agents", { defaultWaitTimeoutSeconds: v ?? 30 })
            }
            min={5}
            max={300}
            step={5}
            className="flex-1"
          />
          <span className="text-muted-foreground w-12 text-right text-[11px] tabular-nums">
            {ai.defaultWaitTimeoutSeconds}s
          </span>
        </div>
      </Row>
      <Row
        label="Log agent requests"
        description="Keep an audit log of every MCP tool invocation."
        htmlFor="log-agent"
      >
        <Switch
          id="log-agent"
          checked={ai.logAgentRequests}
          onCheckedChange={(v) => update("agents", { logAgentRequests: v })}
        />
      </Row>
      <Row
        label="Confirm destructive actions"
        description="Require explicit confirmation for clear_inbox and similar tools."
        htmlFor="confirm-destructive"
      >
        <Switch
          id="confirm-destructive"
          checked={ai.confirmDestructiveActions}
          onCheckedChange={(v) =>
            update("agents", { confirmDestructiveActions: v })
          }
        />
      </Row>
    </Section>
  );
}
