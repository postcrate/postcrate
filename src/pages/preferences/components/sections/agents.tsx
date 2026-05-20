import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeferredCommit } from "@/hooks/use-deferred-commit";
import {
  updateAgentPrefs,
  updateNetworkPrefs,
  useBackendSettings,
  type AgentPrefs,
  type NetworkPrefs,
} from "@/services/settings";

import { Row } from "../row";
import { Section } from "../section";
import { PortInput } from "../port-input";

export function AgentsSection() {
  const { settings } = useBackendSettings();
  const ai = settings?.agents;
  const net = settings?.network;

  function commit(patch: Partial<AgentPrefs>) {
    if (!ai) return;
    updateAgentPrefs({ ...ai, ...patch }).catch((err) =>
      reportIpcError(err, "Couldn't update agent settings"),
    );
  }

  function commitNet(patch: Partial<NetworkPrefs>) {
    if (!net) return;
    updateNetworkPrefs({ ...net, ...patch }).catch((err) =>
      reportIpcError(err, "Couldn't update MCP settings"),
    );
  }

  // Slider commits on release only — without this, dragging fired one
  // IPC per intermediate value and lagged behind the thumb.
  const wait = useDeferredCommit(
    ai?.defaultWaitTimeoutSeconds ?? 30,
    (v) => commit({ defaultWaitTimeoutSeconds: v }),
  );

  return (
    <Section
      title="AI & Agents"
      description="MCP server and how agents interact with the inbox."
    >
      <Row
        label="MCP server"
        description="Expose the inbox to MCP-compatible AI agents."
        htmlFor="mcp-enabled"
        comingSoon
      >
        {net ? (
          <Switch
            id="mcp-enabled"
            checked={net.mcpEnabled}
            onCheckedChange={(v) => commitNet({ mcpEnabled: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
      <Row
        label="MCP port"
        description="Used by Claude Code, Cursor, and other MCP clients."
        htmlFor="mcp-port"
        comingSoon
      >
        {net ? (
          <PortInput
            id="mcp-port"
            value={net.mcpPort}
            onCommit={(n) => commitNet({ mcpPort: n })}
          />
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </Row>
      <Row
        label="Default wait timeout"
        description={
          ai
            ? `wait_for_email blocks up to ${wait.draft}s by default.`
            : "wait_for_email default timeout."
        }
        comingSoon
      >
        {ai ? (
          <div className="flex w-56 items-center gap-3">
            <Slider
              value={[wait.draft]}
              onValueChange={([v]) => wait.setDraft(v ?? 30)}
              onValueCommit={([v]) => wait.commitDraft(v ?? 30)}
              min={5}
              max={300}
              step={5}
              className="flex-1"
            />
            <span className="text-muted-foreground w-12 text-right text-[11px] tabular-nums">
              {wait.draft}s
            </span>
          </div>
        ) : (
          <Skeleton className="h-2 w-56" />
        )}
      </Row>
      <Row
        label="Log agent requests"
        description="Keep an audit log of every MCP tool invocation."
        htmlFor="log-agent"
        comingSoon
      >
        {ai ? (
          <Switch
            id="log-agent"
            checked={ai.logAgentRequests}
            onCheckedChange={(v) => commit({ logAgentRequests: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
      <Row
        label="Confirm destructive actions"
        description="Require explicit confirmation for clear_inbox and similar tools."
        htmlFor="confirm-destructive"
        comingSoon
      >
        {ai ? (
          <Switch
            id="confirm-destructive"
            checked={ai.confirmDestructiveActions}
            onCheckedChange={(v) => commit({ confirmDestructiveActions: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
    </Section>
  );
}
