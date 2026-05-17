import { Input } from "@/components/ui/input";
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
      <Row
        label="Launch at login"
        description="Start postcrate automatically when you sign in."
        htmlFor="launch-at-login"
      >
        <Switch
          id="launch-at-login"
          checked={general.launchAtLogin}
          onCheckedChange={(v) => update("general", { launchAtLogin: v })}
        />
      </Row>
      <Row
        label="Show in Dock"
        description="Hide to run as a menu-bar-only app."
        htmlFor="show-in-dock"
      >
        <Switch
          id="show-in-dock"
          checked={general.showInDock}
          onCheckedChange={(v) => update("general", { showInDock: v })}
        />
      </Row>
      <Row
        label="Show in menu bar"
        description="Quick access to the inbox and recent messages."
        htmlFor="show-in-menu-bar"
      >
        <Switch
          id="show-in-menu-bar"
          checked={general.showInMenuBar}
          onCheckedChange={(v) => update("general", { showInMenuBar: v })}
        />
      </Row>
      <Row
        label="Single instance"
        description="Activate the running app instead of launching a duplicate."
        htmlFor="single-instance"
      >
        <Switch
          id="single-instance"
          checked={general.singleInstance}
          onCheckedChange={(v) => update("general", { singleInstance: v })}
        />
      </Row>
      <Row
        label="Global shortcut"
        description="System-wide hotkey to bring up the inbox spotlight."
        htmlFor="global-shortcut"
      >
        <Input
          id="global-shortcut"
          value={general.globalShortcut}
          onChange={(e) =>
            update("general", { globalShortcut: e.currentTarget.value })
          }
          className="h-8 w-48 font-mono text-[11px]"
        />
      </Row>
    </Section>
  );
}
