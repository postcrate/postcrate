import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { Update } from "@tauri-apps/plugin-updater";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  usePreferencesStore,
  type UpdateChannel,
} from "@/stores/use-preferences-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  checkForUpdate,
  currentVersion,
  installAndRelaunch,
  type DownloadProgress,
} from "@/services/updater";

import { Row } from "../row";
import { Section } from "../section";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "up-to-date" }
  | { kind: "available"; update: Update }
  | { kind: "downloading"; update: Update; progress: DownloadProgress | null }
  | { kind: "error"; message: string };

const UP_TO_DATE_RESET_MS = 3_000;

export function UpdatesSection() {
  const u = usePreferencesStore((s) => s.updates);
  const updatePref = usePreferencesStore((s) => s.update);
  const { data: appVersion } = useSWR("app-version", currentVersion);

  const [state, setState] = useState<State>({ kind: "idle" });

  const onCheck = async () => {
    setState({ kind: "checking" });
    try {
      const upd = await checkForUpdate();
      if (upd) {
        setState({ kind: "available", update: upd });
      } else {
        setState({ kind: "up-to-date" });
        setTimeout(() => {
          setState((cur) =>
            cur.kind === "up-to-date" ? { kind: "idle" } : cur,
          );
        }, UP_TO_DATE_RESET_MS);
      }
    } catch (err) {
      setState({ kind: "error", message: messageFrom(err) });
    }
  };

  const onInstall = async () => {
    if (state.kind !== "available") return;
    const upd = state.update;
    setState({ kind: "downloading", update: upd, progress: null });
    try {
      await installAndRelaunch(upd, (p) => {
        setState({ kind: "downloading", update: upd, progress: p });
      });
      // installAndRelaunch calls relaunch() on success — UI never gets here.
    } catch (err) {
      const message = messageFrom(err);
      setState({ kind: "error", message });
      toast.error("Couldn't install update", { description: message });
    }
  };

  const button = buttonFor(state, onCheck, onInstall);
  const description = descriptionFor(state, appVersion);

  return (
    <Section
      title="Updates"
      description="When Postcrate looks for new versions."
    >
      <Row
        label="Check automatically"
        description="Check for updates once a day in the background."
        htmlFor="auto-check"
      >
        <Switch
          id="auto-check"
          checked={u.autoCheck}
          onCheckedChange={(v) => updatePref("updates", { autoCheck: v })}
        />
      </Row>
      <Row label="Check now" description={description}>
        <Button
          variant={button.variant}
          size="sm"
          className="h-8 text-xs"
          onClick={button.onClick}
          disabled={button.disabled}
        >
          {button.label}
        </Button>
      </Row>
      <Row
        label="Channel"
        description="Stable for releases. Beta for early access."
        htmlFor="channel"
        comingSoon
      >
        <Select
          value={u.channel}
          onValueChange={(v) =>
            updatePref("updates", { channel: v as UpdateChannel })
          }
        >
          <SelectTrigger id="channel" className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
          </SelectContent>
        </Select>
      </Row>
    </Section>
  );
}

type ButtonSpec = {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant: "default" | "outline";
};

function buttonFor(
  state: State,
  onCheck: () => void,
  onInstall: () => void,
): ButtonSpec {
  switch (state.kind) {
    case "idle":
      return {
        label: "Check for updates",
        onClick: onCheck,
        disabled: false,
        variant: "outline",
      };
    case "checking":
      return {
        label: "Checking…",
        onClick: () => {},
        disabled: true,
        variant: "outline",
      };
    case "up-to-date":
      return {
        label: "Up to date",
        onClick: () => {},
        disabled: true,
        variant: "outline",
      };
    case "available":
      return {
        label: `Install v${state.update.version}`,
        onClick: onInstall,
        disabled: false,
        variant: "default",
      };
    case "downloading": {
      const pct =
        state.progress && state.progress.total
          ? Math.round(
              (state.progress.downloaded / state.progress.total) * 100,
            )
          : null;
      return {
        label: pct !== null ? `Downloading ${pct}%` : "Downloading…",
        onClick: () => {},
        disabled: true,
        variant: "default",
      };
    }
    case "error":
      return {
        label: "Try again",
        onClick: onCheck,
        disabled: false,
        variant: "outline",
      };
  }
}

function descriptionFor(
  state: State,
  appVersion: string | undefined,
): string {
  const current = appVersion ? `Postcrate ${appVersion}` : "Postcrate";
  switch (state.kind) {
    case "idle":
      return `${current}. Look for a new version right now.`;
    case "checking":
      return "Checking for updates…";
    case "up-to-date":
      return `${current}. You're on the latest version.`;
    case "available":
      return `Postcrate ${state.update.version} is available.`;
    case "downloading":
      return `Downloading Postcrate ${state.update.version}…`;
    case "error":
      return `Couldn't check for updates: ${state.message}`;
  }
}

function messageFrom(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
