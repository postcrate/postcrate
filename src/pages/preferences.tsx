import { useState } from "react";
import {
  PaintBrushIcon,
  GearIcon,
  BellIcon,
  TrayIcon,
  GlobeIcon,
  RobotIcon,
  ShieldIcon,
  ArrowsClockwiseIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePreferencesStore,
  type Density,
  type InboxView,
  type UpdateChannel,
} from "@/stores/use-preferences-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SECTIONS = [
  { id: "appearance", label: "Appearance", Icon: PaintBrushIcon },
  { id: "general", label: "General", Icon: GearIcon },
  { id: "notifications", label: "Notifications", Icon: BellIcon },
  { id: "inbox", label: "Inbox", Icon: TrayIcon },
  { id: "network", label: "Network & Listeners", Icon: GlobeIcon },
  { id: "agents", label: "AI & Agents", Icon: RobotIcon },
  { id: "privacy", label: "Privacy", Icon: ShieldIcon },
  { id: "updates", label: "Updates", Icon: ArrowsClockwiseIcon },
  { id: "advanced", label: "Advanced", Icon: WrenchIcon },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function Preferences() {
  const [active, setActive] = useState<SectionId>("appearance");

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div data-tauri-drag-region className="h-10 shrink-0" />
        <nav className="flex-1 space-y-px overflow-y-auto px-2 pt-1">
          {SECTIONS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-[15px] shrink-0",
                    isActive ? "opacity-100" : "opacity-70",
                  )}
                  weight={isActive ? "fill" : "regular"}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="relative flex-1 overflow-auto overscroll-none">
        <div
          data-tauri-drag-region
          className="sticky top-0 z-10 h-10 shrink-0"
        />
        <div className="mx-auto -mt-10 max-w-2xl px-10 pb-12 pt-14">
          {active === "appearance" && <AppearanceSection />}
          {active === "general" && <GeneralSection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "inbox" && <InboxSection />}
          {active === "network" && <NetworkSection />}
          {active === "agents" && <AgentsSection />}
          {active === "privacy" && <PrivacySection />}
          {active === "updates" && <UpdatesSection />}
          {active === "advanced" && <AdvancedSection />}
        </div>
      </main>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-5">
      <h1 className="text-[19px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
        {description}
      </p>
    </header>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SectionHeader title={title} description={description} />
      <div className="divide-y divide-border/60">{children}</div>
    </>
  );
}

function Row({
  label,
  description,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <div className="min-w-0 flex-1">
        <Label htmlFor={htmlFor} className="text-[13px] font-medium">
          {label}
        </Label>
        {description && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

function PortInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Input
      id={id}
      type="number"
      min={1}
      max={65535}
      value={value}
      onChange={(e) => onChange(Number(e.currentTarget.value) || 0)}
      className="w-28 text-right tabular-nums"
    />
  );
}

function AppearanceSection() {
  const { density, monoForCode } = usePreferencesStore((s) => s.appearance);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Appearance"
      description="How postcrate looks on your machine."
    >
      <Row label="Theme" description="Light, dark, or follow the system.">
        <ThemeToggle />
      </Row>
      <Row
        label="Density"
        description="Spacing between rows in the inbox and lists."
        htmlFor="density"
      >
        <Select
          value={density}
          onValueChange={(v) => update("appearance", { density: v as Density })}
        >
          <SelectTrigger id="density" className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comfortable">Comfortable</SelectItem>
            <SelectItem value="compact">Compact</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row
        label="Mono font for code"
        description="Use a monospace font for raw email source and headers."
        htmlFor="mono-code"
      >
        <Switch
          id="mono-code"
          checked={monoForCode}
          onCheckedChange={(v) => update("appearance", { monoForCode: v })}
        />
      </Row>
    </Section>
  );
}

function GeneralSection() {
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

function NotificationsSection() {
  const n = usePreferencesStore((s) => s.notifications);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Notifications"
      description="How postcrate tells you about incoming mail."
    >
      <Row
        label="System notifications"
        description="Show a native OS notification when an email arrives."
        htmlFor="desktop-new-email"
      >
        <Switch
          id="desktop-new-email"
          checked={n.desktopOnNewEmail}
          onCheckedChange={(v) =>
            update("notifications", { desktopOnNewEmail: v })
          }
        />
      </Row>
      <Row
        label="In-app toast"
        description="Show a transient toast inside postcrate."
        htmlFor="in-app-toast"
      >
        <Switch
          id="in-app-toast"
          checked={n.inAppToast}
          onCheckedChange={(v) => update("notifications", { inAppToast: v })}
        />
      </Row>
      <Row
        label="Sound"
        description="Play a soft chime on each new email."
        htmlFor="sound-new-email"
      >
        <Switch
          id="sound-new-email"
          checked={n.soundOnNewEmail}
          onCheckedChange={(v) =>
            update("notifications", { soundOnNewEmail: v })
          }
        />
      </Row>
      <Row
        label="Dock badge"
        description="Show an unread count badge on the Dock icon."
        htmlFor="badge-unread"
      >
        <Switch
          id="badge-unread"
          checked={n.badgeUnreadCount}
          onCheckedChange={(v) =>
            update("notifications", { badgeUnreadCount: v })
          }
        />
      </Row>
    </Section>
  );
}

function InboxSection() {
  const inbox = usePreferencesStore((s) => s.inbox);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Inbox"
      description="Defaults for how captured email is organized and retained."
    >
      <Row
        label="Default view"
        description="How emails are rendered when you open a mailbox."
        htmlFor="default-view"
      >
        <Select
          value={inbox.defaultView}
          onValueChange={(v) =>
            update("inbox", { defaultView: v as InboxView })
          }
        >
          <SelectTrigger id="default-view" className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List</SelectItem>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="cards">Cards</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row
        label="Group related emails"
        description="Collapse same-recipient threads into a single row."
        htmlFor="thread-related"
      >
        <Switch
          id="thread-related"
          checked={inbox.threadRelated}
          onCheckedChange={(v) => update("inbox", { threadRelated: v })}
        />
      </Row>
      <Row
        label="Auto-tag emails"
        description="Detect auth, billing, marketing, and system mail locally."
        htmlFor="auto-tag"
      >
        <Switch
          id="auto-tag"
          checked={inbox.autoTag}
          onCheckedChange={(v) => update("inbox", { autoTag: v })}
        />
      </Row>
      <Row
        label="Max retained emails"
        description="Older emails are pruned when this limit is exceeded."
        htmlFor="max-retained"
      >
        <Input
          id="max-retained"
          type="number"
          min={100}
          step={100}
          value={inbox.maxRetainedEmails}
          onChange={(e) =>
            update("inbox", {
              maxRetainedEmails: Number(e.currentTarget.value) || 0,
            })
          }
          className="h-8 w-24 text-right text-xs tabular-nums"
        />
      </Row>
      <Row
        label="Auto-clear after"
        description={`Currently set to ${inbox.autoClearAfterDays} days. Set to 0 to disable.`}
      >
        <div className="flex w-56 items-center gap-3">
          <Slider
            value={[inbox.autoClearAfterDays]}
            onValueChange={([v]) =>
              update("inbox", { autoClearAfterDays: v ?? 0 })
            }
            min={0}
            max={90}
            step={1}
            className="flex-1"
          />
          <span className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">
            {inbox.autoClearAfterDays}d
          </span>
        </div>
      </Row>
    </Section>
  );
}

function NetworkSection() {
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

function AgentsSection() {
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
          <span className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">
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

function PrivacySection() {
  const p = usePreferencesStore((s) => s.privacy);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Privacy"
      description="postcrate is local-by-default. Telemetry is never collected."
    >
      <Row
        label="Spam scoring"
        description="Score captured emails against SpamAssassin-equivalent heuristics. Runs locally."
        htmlFor="spam-scoring"
      >
        <Switch
          id="spam-scoring"
          checked={p.enableSpamScoring}
          onCheckedChange={(v) => update("privacy", { enableSpamScoring: v })}
        />
      </Row>
      <Row
        label="Link checking"
        description="Verify links in captured emails. Makes HEAD requests to remote hosts."
        htmlFor="link-checking"
      >
        <div className="flex items-center gap-2">
          {p.enableLinkChecking && (
            <Badge variant="secondary" className="text-[10px]">
              Network
            </Badge>
          )}
          <Switch
            id="link-checking"
            checked={p.enableLinkChecking}
            onCheckedChange={(v) =>
              update("privacy", { enableLinkChecking: v })
            }
          />
        </div>
      </Row>
      <Row
        label="Accessibility checks"
        description="Lint emails for color contrast, alt text, and semantic structure."
        htmlFor="a11y-checks"
      >
        <Switch
          id="a11y-checks"
          checked={p.enableA11yChecking}
          onCheckedChange={(v) => update("privacy", { enableA11yChecking: v })}
        />
      </Row>
      <Row
        label="Telemetry"
        description="postcrate does not collect telemetry. This is enforced at the source."
      >
        <Badge variant="outline" className="text-[10px]">
          Always off
        </Badge>
      </Row>
    </Section>
  );
}

function UpdatesSection() {
  const u = usePreferencesStore((s) => s.updates);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Updates"
      description="How and when postcrate looks for new versions."
    >
      <Row
        label="Check automatically"
        description="Look for updates in the background once a day."
        htmlFor="auto-check"
      >
        <Switch
          id="auto-check"
          checked={u.autoCheck}
          onCheckedChange={(v) => update("updates", { autoCheck: v })}
        />
      </Row>
      <Row
        label="Channel"
        description="Stable for release builds, beta for early access."
        htmlFor="channel"
      >
        <Select
          value={u.channel}
          onValueChange={(v) =>
            update("updates", { channel: v as UpdateChannel })
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
      <Row
        label="Check now"
        description="Manually look for a new version."
      >
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Check for updates
        </Button>
      </Row>
    </Section>
  );
}

function AdvancedSection() {
  const a = usePreferencesStore((s) => s.advanced);
  const update = usePreferencesStore((s) => s.update);
  const reset = usePreferencesStore((s) => s.reset);

  return (
    <Section
      title="Advanced"
      description="Diagnostics, raw captures, and a way to start over."
    >
      <Row
        label="Debug logging"
        description="Verbose logs for troubleshooting. Increases disk usage."
        htmlFor="debug-logging"
      >
        <Switch
          id="debug-logging"
          checked={a.debugLogging}
          onCheckedChange={(v) => update("advanced", { debugLogging: v })}
        />
      </Row>
      <Row
        label="Preserve SMTP transcript"
        description="Keep the raw conversation for each captured email."
        htmlFor="preserve-smtp"
      >
        <Switch
          id="preserve-smtp"
          checked={a.preserveSmtpTranscript}
          onCheckedChange={(v) =>
            update("advanced", { preserveSmtpTranscript: v })
          }
        />
      </Row>
      <Row
        label={
          <span className="text-destructive">Reset all preferences</span>
        }
        description="Restore every setting to its default value. Cannot be undone."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="h-8 text-xs">
              Reset…
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all preferences?</AlertDialogTitle>
              <AlertDialogDescription>
                Every setting on every tab will return to its default. Your
                captured emails are not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={reset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Row>
    </Section>
  );
}
