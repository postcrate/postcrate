import { useNavigate } from "react-router-dom";
import {
  ArrowsClockwiseIcon,
  ClipboardTextIcon,
  FileArrowUpIcon,
  FlaskIcon,
  GearIcon,
  PackageIcon,
  PlusIcon,
  TrayIcon,
  WebhooksLogoIcon,
} from "@phosphor-icons/react/dist/ssr";

import { useMailboxes } from "@/services/mailbox";
import { useViewStore } from "@/stores/use-view-store";
import { useDialogsStore } from "@/stores/use-dialogs-store";
import { useProjectsStore } from "@/stores/use-projects-store";
import { replayRecordingFromFile } from "@/services/recording";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const projectId = useProjectsStore((s) => s.currentId);
  const { mailboxes } = useMailboxes(projectId);
  const activeMailboxId = useViewStore((s) => s.mailboxId);
  const setMailboxId = useViewStore((s) => s.setMailboxId);
  const openNewMailbox = useDialogsStore((s) => s.openNewMailbox);

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  const activeMailbox = mailboxes?.find((m) => m.id === activeMailboxId);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump to a screen or run an action."
    >
      <CommandInput placeholder="Search or run a command…" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>

        <CommandGroup heading="Go to">
          <CommandItem
            onSelect={() => run(() => navigate("/inbox"))}
            keywords={["mail", "messages"]}
          >
            <TrayIcon />
            Inbox
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate("/mailboxes"))}
            keywords={["smtp", "listener", "port"]}
          >
            <PackageIcon />
            Mailboxes
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate("/scenarios"))}
            keywords={["chaos", "bounce", "fault"]}
          >
            <FlaskIcon />
            Scenarios
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate("/webhooks"))}
            keywords={["http", "post", "event"]}
          >
            <WebhooksLogoIcon />
            Webhooks
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate("/audit"))}
            keywords={["log", "history", "activity"]}
          >
            <ClipboardTextIcon />
            Logs
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate("/preferences"))}
            keywords={["settings", "config", "options"]}
          >
            <GearIcon />
            Preferences
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {mailboxes && mailboxes.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Open mailbox">
              {mailboxes.map((mb) => (
                <CommandItem
                  key={mb.id}
                  value={`mailbox-${mb.id}-${mb.name}`}
                  keywords={[mb.name, String(mb.port)]}
                  onSelect={() =>
                    run(() => {
                      setMailboxId(mb.id);
                      navigate("/inbox");
                    })
                  }
                >
                  <TrayIcon />
                  <span className="truncate">{mb.name}</span>
                  <span className="text-muted-foreground ml-auto font-mono text-[11px]">
                    :{mb.port}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => run(() => openNewMailbox())}
            keywords={["create", "add"]}
          >
            <PlusIcon />
            New mailbox
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          {activeMailbox ? (
            <CommandItem
              onSelect={() =>
                run(() => {
                  void replayRecordingFromFile(activeMailbox.id);
                })
              }
              keywords={["import", "load", "recording"]}
            >
              <FileArrowUpIcon />
              Replay file into {activeMailbox.name}
            </CommandItem>
          ) : null}
          <CommandItem
            onSelect={() =>
              run(() => {
                window.location.reload();
              })
            }
            keywords={["refresh", "restart"]}
          >
            <ArrowsClockwiseIcon />
            Reload window
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
