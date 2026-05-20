import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  updateNetworkPrefs,
  useBackendSettings,
  type NetworkPrefs,
} from "@/services/settings";

import { Row } from "../row";
import { Section } from "../section";
import { PortInput } from "../port-input";

export function NetworkSection() {
  const { settings } = useBackendSettings();
  const net = settings?.network;

  function commit(patch: Partial<NetworkPrefs>) {
    if (!net) return;
    updateNetworkPrefs({ ...net, ...patch }).catch((err) =>
      reportIpcError(err, "Couldn't update network settings"),
    );
  }

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
        {net ? (
          <PortInput
            id="smtp-port"
            value={net.smtpPort}
            onCommit={(n) => commit({ smtpPort: n })}
          />
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </Row>
      <Row
        label="HTTP API port"
        description="Used by test matchers, the CLI, and editor extensions."
        htmlFor="http-port"
      >
        {net ? (
          <PortInput
            id="http-port"
            value={net.httpApiPort}
            onCommit={(n) => commit({ httpApiPort: n })}
          />
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </Row>
      <Row
        label="HTTP API over TLS"
        description="Serve /api/v1 over HTTPS using the STARTTLS cert. Requires the tls build feature."
        htmlFor="api-tls"
      >
        {net ? (
          <Switch
            id="api-tls"
            checked={net.apiTls ?? false}
            onCheckedChange={(v) => commit({ apiTls: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
      <Row
        label="API auth token"
        description="Required as `Authorization: Bearer …` on every /api/v1 request. Leave empty to disable."
        htmlFor="api-auth-token"
      >
        {net ? (
          <ApiAuthTokenInput
            value={net.apiAuthToken ?? null}
            onCommit={(token) => commit({ apiAuthToken: token })}
          />
        ) : (
          <Skeleton className="h-8 w-56" />
        )}
      </Row>
      <Row
        label="MCP server"
        description="Expose the inbox to MCP-compatible AI agents."
        htmlFor="mcp-enabled"
      >
        {net ? (
          <Switch
            id="mcp-enabled"
            checked={net.mcpEnabled}
            onCheckedChange={(v) => commit({ mcpEnabled: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
      <Row
        label="MCP port"
        description="Used by Claude Code, Cursor, and other MCP clients."
        htmlFor="mcp-port"
      >
        {net ? (
          <PortInput
            id="mcp-port"
            value={net.mcpPort}
            onCommit={(n) => commit({ mcpPort: n })}
          />
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </Row>
      <Row
        label="Expose on LAN"
        description="Allow other devices on your network to connect. Off by default for safety."
        htmlFor="expose-lan"
      >
        {net ? (
          <div className="flex items-center gap-2">
            {net.exposeOnLan && (
              <Badge variant="destructive" className="text-[10px]">
                Not local-only
              </Badge>
            )}
            <Switch
              id="expose-lan"
              checked={net.exposeOnLan}
              onCheckedChange={(v) => commit({ exposeOnLan: v })}
            />
          </div>
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
    </Section>
  );
}

type TokenProps = {
  value: string | null;
  onCommit: (token: string | null) => void;
};

function ApiAuthTokenInput({ value, onCommit }: TokenProps) {
  const [draft, setDraft] = useState(value ?? "");

  function flush() {
    const trimmed = draft.trim();
    const next = trimmed.length === 0 ? null : trimmed;
    if (next !== value) onCommit(next);
  }

  return (
    <Input
      id="api-auth-token"
      type="password"
      autoComplete="off"
      placeholder="empty = no auth"
      value={draft}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={flush}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
      }}
      className="h-8 w-56 font-mono text-[11.5px]"
    />
  );
}
