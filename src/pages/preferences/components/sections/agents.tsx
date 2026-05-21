import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useBackendSettings } from "@/services/settings";

import { Row } from "../row";
import { Section } from "../section";
import { PortInput } from "../port-input";

/**
 * AI & Agents preferences.
 *
 * Every row here is gated on engine work that hasn't landed yet (the
 * MCP server, agent audit logging, destructive-action confirmation,
 * etc.), so the controls render the persisted defaults but are all
 * disabled and carry a "Soon" badge. Once the engine ships each
 * capability we'll re-enable the corresponding row and wire its
 * commit handler.
 */
const NOOP = () => {};

export function AgentsSection() {
  const { settings } = useBackendSettings();
  const ai = settings?.agents;
  const net = settings?.network;

  return (
    <Section
      title="Agents"
      description="MCP server and how agents reach the inbox."
    >
      <Row
        label="MCP server"
        description="Open the inbox to MCP-compatible agents."
        htmlFor="mcp-enabled"
        comingSoon
      >
        <Switch
          id="mcp-enabled"
          checked={net?.mcpEnabled ?? false}
          onCheckedChange={NOOP}
          disabled
        />
      </Row>
      <Row
        label="MCP port"
        description="Used by Claude Code, Cursor, and other MCP clients."
        htmlFor="mcp-port"
        comingSoon
      >
        <PortInput
          id="mcp-port"
          value={net?.mcpPort ?? 8026}
          onCommit={NOOP}
          disabled
        />
      </Row>
      <Row
        label="Default wait timeout"
        description={`wait_for_email blocks up to ${ai?.defaultWaitTimeoutSeconds ?? 30}s.`}
        comingSoon
      >
        <div className="flex w-56 items-center gap-3">
          <Slider
            value={[ai?.defaultWaitTimeoutSeconds ?? 30]}
            min={5}
            max={300}
            step={5}
            disabled
            className="flex-1"
          />
          <span className="text-muted-foreground w-12 text-right text-[11px] tabular-nums">
            {ai?.defaultWaitTimeoutSeconds ?? 30}s
          </span>
        </div>
      </Row>
      <Row
        label="Log agent requests"
        description="Record every MCP tool call to the audit log."
        htmlFor="log-agent"
        comingSoon
      >
        <Switch
          id="log-agent"
          checked={ai?.logAgentRequests ?? true}
          onCheckedChange={NOOP}
          disabled
        />
      </Row>
      <Row
        label="Confirm destructive actions"
        description="Ask before running clear_inbox and similar tools."
        htmlFor="confirm-destructive"
        comingSoon
      >
        <Switch
          id="confirm-destructive"
          checked={ai?.confirmDestructiveActions ?? true}
          onCheckedChange={NOOP}
          disabled
        />
      </Row>
    </Section>
  );
}
