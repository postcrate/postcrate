import { toast } from "sonner";
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

  function commit(patch: Partial<NetworkPrefs>, successLabel?: string) {
    if (!net) return;
    updateNetworkPrefs({ ...net, ...patch })
      .then(() => {
        if (successLabel) toast.success(successLabel);
      })
      .catch((err) =>
        reportIpcError(err, "Couldn't update network settings"),
      );
  }

  return (
    <Section
      title="Network"
      description="Access and exposure for the HTTP API. Changes take effect right away."
    >
      <Row
        label="HTTP API port"
        description="Used by test matchers, the CLI, and editor extensions."
        htmlFor="http-port"
      >
        {net ? (
          <PortInput
            id="http-port"
            value={net.httpApiPort}
            onCommit={(n) =>
              commit({ httpApiPort: n }, `API moved to port ${n}`)
            }
          />
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </Row>
      <Row
        label="API auth token"
        description="Sent as `Authorization: Bearer …` on every /api/v1 request. Leave empty to turn off auth."
        htmlFor="api-auth-token"
      >
        {net ? (
          <ApiAuthTokenInput
            value={net.apiAuthToken ?? null}
            onCommit={(token) =>
              commit(
                { apiAuthToken: token },
                token ? "Bearer auth on" : "Bearer auth off",
              )
            }
          />
        ) : (
          <Skeleton className="h-8 w-56" />
        )}
      </Row>
      <Row
        label="Expose on LAN"
        description="Let other devices on your network connect. Off by default."
        htmlFor="expose-lan"
      >
        {net ? (
          <div className="flex items-center gap-2">
            {net.exposeOnLan && (
              <Badge variant="destructive" className="text-[10px]">
                Reachable on LAN
              </Badge>
            )}
            <Switch
              id="expose-lan"
              checked={net.exposeOnLan}
              onCheckedChange={(v) =>
                commit(
                  { exposeOnLan: v },
                  v ? "Now bound to 0.0.0.0" : "Now bound to 127.0.0.1",
                )
              }
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
      placeholder="Empty for no auth"
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
