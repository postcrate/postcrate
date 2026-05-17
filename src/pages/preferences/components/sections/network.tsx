import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from "@/stores/use-preferences-store";

import { Row } from "../row";
import { Section } from "../section";
import { PortInput } from "../port-input";

export function NetworkSection() {
  const net = usePreferencesStore((s) => s.network);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Network & Listeners"
      description="Ports and exposure for the SMTP, HTTP, and MCP servers."
    >
      <Row
        label="SMTP port"
        description="Where senders connect to deliver mail."
        htmlFor="smtp-port"
      >
        <PortInput
          id="smtp-port"
          value={net.smtpPort}
          onChange={(n) => update("network", { smtpPort: n })}
        />
      </Row>
      <Row
        label="HTTP API port"
        description="Used by test matchers, the CLI, and editor extensions."
        htmlFor="http-port"
      >
        <PortInput
          id="http-port"
          value={net.httpApiPort}
          onChange={(n) => update("network", { httpApiPort: n })}
        />
      </Row>
      <Row
        label="MCP server"
        description="Expose the inbox to MCP-compatible AI agents."
        htmlFor="mcp-enabled"
      >
        <Switch
          id="mcp-enabled"
          checked={net.mcpEnabled}
          onCheckedChange={(v) => update("network", { mcpEnabled: v })}
        />
      </Row>
      <Row
        label="MCP port"
        description="Used by Claude Code, Cursor, and other MCP clients."
        htmlFor="mcp-port"
      >
        <PortInput
          id="mcp-port"
          value={net.mcpPort}
          onChange={(n) => update("network", { mcpPort: n })}
        />
      </Row>
      <Row
        label="Expose on LAN"
        description="Allow other devices on your network to connect. Off by default for safety."
        htmlFor="expose-lan"
      >
        <div className="flex items-center gap-2">
          {net.exposeOnLan && (
            <Badge variant="destructive" className="text-[10px]">
              Not local-only
            </Badge>
          )}
          <Switch
            id="expose-lan"
            checked={net.exposeOnLan}
            onCheckedChange={(v) => update("network", { exposeOnLan: v })}
          />
        </div>
      </Row>
    </Section>
  );
}
