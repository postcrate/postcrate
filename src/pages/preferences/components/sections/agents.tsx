import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeferredCommit } from "@/hooks/use-deferred-commit";
import {
  updateAgentPrefs,
  useBackendSettings,
  type AgentPrefs,
} from "@/services/settings";

import { Row } from "../row";
import { Section } from "../section";

export function AgentsSection() {
  const { settings } = useBackendSettings();
  const ai = settings?.agents;

  function commit(patch: Partial<AgentPrefs>) {
    if (!ai) return;
    updateAgentPrefs({ ...ai, ...patch }).catch((err) =>
      reportIpcError(err, "Couldn't update agent settings"),
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
      description="Behavior of the MCP server and how agents interact with the inbox."
    >
      <Row
        label="Default wait timeout"
        description={
          ai
            ? `wait_for_email blocks up to ${wait.draft}s by default.`
            : "wait_for_email default timeout."
        }
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
