import { useEffect, useState } from "react";
import {
  ArrowFatUpIcon,
  CommandIcon,
  ControlIcon,
  OptionIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from "@/stores/use-preferences-store";

import { Row } from "../row";
import { Section } from "../section";

export function GeneralSection() {
  const general = usePreferencesStore((s) => s.general);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="General"
      description="Launch behavior, system integration, and shortcuts."
    >
      <LaunchAtLoginRow />
      <Row
        label="Show in Dock"
        description="Hide the dock icon to run postcrate as a background utility. Re-show via the global shortcut."
        htmlFor="show-in-dock"
      >
        <Switch
          id="show-in-dock"
          checked={general.showInDock}
          onCheckedChange={(v) => update("general", { showInDock: v })}
        />
      </Row>
      <Row
        label="Global shortcut"
        description="System-wide hotkey to bring postcrate to the front."
      >
        <ShortcutRecorder
          value={general.globalShortcut}
          onChange={(v) => update("general", { globalShortcut: v })}
        />
      </Row>
    </Section>
  );
}

function LaunchAtLoginRow() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    isAutostartEnabled()
      .then((v) => {
        if (mounted) setEnabled(v);
      })
      .catch(() => {
        /* plugin unavailable; leave as false */
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function toggle(next: boolean) {
    setEnabled(next);
    try {
      if (next) await enableAutostart();
      else await disableAutostart();
    } catch {
      setEnabled(!next);
    }
  }

  return (
    <Row
      label="Launch at login"
      description="Start postcrate automatically when you sign in."
      htmlFor="launch-at-login"
    >
      <Switch
        id="launch-at-login"
        checked={enabled}
        disabled={loading}
        onCheckedChange={toggle}
      />
    </Row>
  );
}

function ShortcutRecorder({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!recording) return;

    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecording(false);
        return;
      }
      // Modifier keys alone aren't a valid binding — wait for the real key.
      if (["Meta", "Control", "Shift", "Alt"].includes(e.key)) return;

      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push("CommandOrControl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");
      // Tauri's accelerator needs at least one modifier. Avoid registering
      // a bare key like "A" which would steal that letter system-wide.
      if (parts.length === 0) return;

      let key = e.code;
      if (key.startsWith("Key")) key = key.slice(3);
      else if (key.startsWith("Digit")) key = key.slice(5);
      else key = e.key;

      parts.push(key);
      onChange(parts.join("+"));
      setRecording(false);
    }

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [recording, onChange]);

  return (
    <button
      type="button"
      onClick={() => setRecording((r) => !r)}
      className={cn(
        "inline-flex items-center gap-1 transition-opacity",
        recording && "animate-pulse",
      )}
    >
      {recording ? (
        <Kbd className="h-6 px-2 text-[11px] font-medium">
          Press shortcut…
        </Kbd>
      ) : value ? (
        value.split("+").map((part, i) => (
          <Kbd key={`${part}-${i}`} className="h-6 min-w-6 px-1.5 text-[11.5px]">
            {renderKey(part)}
          </Kbd>
        ))
      ) : (
        <Kbd className="text-muted-foreground/70 h-6 px-2 text-[11px]">
          Not set
        </Kbd>
      )}
    </button>
  );
}

function renderKey(part: string): React.ReactNode {
  // Tauri's accelerator parser accepts several aliases for each
  // modifier (Cmd / Command / Meta / Super …). Normalize before
  // matching so the icon shows up regardless of which form is stored.
  const norm = part.toLowerCase();
  if (
    norm === "commandorcontrol" ||
    norm === "cmdorctrl" ||
    norm === "command" ||
    norm === "cmd" ||
    norm === "meta" ||
    norm === "super"
  ) {
    return <CommandIcon weight="bold" aria-label="Command" />;
  }
  if (norm === "control" || norm === "ctrl") {
    return <ControlIcon weight="bold" aria-label="Control" />;
  }
  if (norm === "shift") {
    return <ArrowFatUpIcon weight="bold" aria-label="Shift" />;
  }
  if (norm === "alt" || norm === "option") {
    return <OptionIcon weight="bold" aria-label="Option" />;
  }
  return part.toUpperCase();
}
