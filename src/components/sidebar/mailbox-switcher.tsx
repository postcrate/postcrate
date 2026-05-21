import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CaretUpDownIcon,
  CheckIcon,
  HouseLineIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { useViewStore } from "@/stores/use-view-store";
import { useDialogsStore } from "@/stores/use-dialogs-store";
import { useProjectsStore } from "@/stores/use-projects-store";
import { useMailboxes, type Mailbox, type MailboxKind } from "@/services/mailbox";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { isMailboxRunning } from "./sidebar-status";

const KIND_SWATCH: Record<MailboxKind, string> = {
  primary: "bg-warn",
  ephemeral: "bg-info",
  shared: "bg-muted-foreground/60",
};

export function MailboxSwitcher() {
  const navigate = useNavigate();
  const projectId = useProjectsStore((s) => s.currentId);
  const mailboxId = useViewStore((s) => s.mailboxId);
  const setMailboxId = useViewStore((s) => s.setMailboxId);
  const openNewMailbox = useDialogsStore((s) => s.openNewMailbox);

  const { mailboxes } = useMailboxes(projectId);
  const list = mailboxes ?? [];
  const current = list.find((m) => m.id === mailboxId) ?? list[0];
  // Live indicator reflects the *current* mailbox's actual state —
  // not a UI-only flag — so Start/Stop changes (from the row context
  // menu or the bottom-of-sidebar button) refresh this chip too.
  const running = isMailboxRunning(current);

  // Reconcile the view's mailboxId against the *current* project's
  // list. Without this, switching projects (or deleting one and
  // falling back) leaves view.mailboxId pointing at a mailbox that
  // doesn't belong here — InboxPage then shows "Pick a mailbox" even
  // though the fallback project has mailboxes ready to use.
  useEffect(() => {
    if (mailboxes === undefined) return;
    const nextId = current?.id ?? null;
    if (nextId !== mailboxId) setMailboxId(nextId);
  }, [mailboxes, current, mailboxId, setMailboxId]);

  if (!current) {
    return (
      <div className="px-2 pt-1 pb-2">
        <button
          onClick={openNewMailbox}
          className={cn(
            "group flex h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left",
            "bg-sidebar-accent/40 hover:bg-sidebar-accent/60 transition-colors",
          )}
        >
          <span className="bg-sidebar-border/60 dark:bg-sidebar/60 grid size-6 shrink-0 place-items-center rounded-md">
            <PlusIcon size={11} weight="bold" className="text-muted-foreground" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="text-foreground truncate text-[12.5px] font-medium">
              No mailbox yet
            </span>
            <span className="text-muted-foreground/80 truncate text-[10.5px]">
              Create one to start receiving mail
            </span>
          </span>
          <Kbd className="h-4 text-[10px]">⌘N</Kbd>
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 pt-1 pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "group flex h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left",
            "bg-sidebar-accent/60 hover:bg-sidebar-accent/80 data-[state=open]:bg-sidebar-accent",
            "transition-colors outline-none",
          )}
        >
          <MailboxChip kind={current.kind} live={running} />
          <MailboxLabel mailbox={current} />
          <CaretUpDownIcon
            size={11}
            weight="bold"
            className="text-muted-foreground/0 group-hover:text-muted-foreground/70 group-data-[state=open]:text-muted-foreground/70 shrink-0 transition-colors"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={4}
          className="w-(--radix-dropdown-menu-trigger-width) min-w-60 p-1"
        >
          <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
            Switch mailbox
          </DropdownMenuLabel>
          {list.map((m) => {
            const isCurrent = m.id === current.id;
            return (
              <DropdownMenuItem
                key={m.id}
                onSelect={() => {
                  setMailboxId(m.id);
                  navigate("/inbox");
                }}
                className="h-9 gap-2 px-2"
              >
                <Swatch kind={m.kind} />
                <MailboxRow mailbox={m} />
                <span className="text-muted-foreground/70 shrink-0 font-mono text-[10.5px] tabular-nums">
                  {m.count}
                </span>
                {isCurrent ? (
                  <CheckIcon
                    size={12}
                    weight="bold"
                    className="text-brand shrink-0"
                  />
                ) : (
                  <span className="size-3 shrink-0" aria-hidden />
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={openNewMailbox}
            className="text-muted-foreground h-8 gap-2 px-2 text-[12.5px]"
          >
            <PlusIcon size={12} weight="bold" />
            <span>New mailbox</span>
            <Kbd className="ml-auto h-4 text-[10px]">⌘N</Kbd>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MailboxChip({ kind, live }: { kind: MailboxKind; live: boolean }) {
  return (
    <span
      aria-hidden
      className="bg-sidebar-border dark:bg-sidebar/60 relative grid size-6 shrink-0 place-items-center rounded-md"
    >
      <span className={cn("size-2.5 rounded-[3px]", KIND_SWATCH[kind])} />
      {live ? (
        <span className="bg-success ring-sidebar-accent motion-safe:animate-[pulse-soft_1.8s_ease-in-out_infinite] absolute -top-0.5 -right-0.5 size-1.5 rounded-full ring-2" />
      ) : null}
    </span>
  );
}

function Swatch({ kind }: { kind: MailboxKind }) {
  return (
    <span
      aria-hidden
      className={cn("size-2.5 shrink-0 rounded-[3px]", KIND_SWATCH[kind])}
    />
  );
}

function MailboxLabel({ mailbox }: { mailbox: Mailbox }) {
  const ttl = mailbox.kind === "ephemeral" ? formatRemaining(mailbox.expiresAt) : null;
  return (
    <span className="flex min-w-0 flex-1 flex-col leading-tight">
      <span className="text-foreground truncate text-[12.5px] font-medium">
        {mailbox.name}
      </span>
      <span
        className="text-muted-foreground/80 flex min-w-0 items-center gap-1 font-mono text-[10.5px] tabular-nums"
        title="Local listener"
      >
        <HouseLineIcon
          size={10}
          weight="bold"
          className="text-muted-foreground/55 shrink-0"
        />
        <span className="truncate">
          127.0.0.1:{mailbox.port}
          {ttl ? ` · ${ttl}` : ""}
        </span>
      </span>
    </span>
  );
}

function MailboxRow({ mailbox }: { mailbox: Mailbox }) {
  const ttl = mailbox.kind === "ephemeral" ? formatRemaining(mailbox.expiresAt) : null;
  return (
    <span className="flex min-w-0 flex-1 flex-col leading-tight">
      <span className="text-foreground truncate text-[12.5px] font-medium">
        {mailbox.name}
      </span>
      <span className="text-muted-foreground/70 font-mono text-[10px] tabular-nums">
        :{mailbox.port}
        {ttl ? ` · ${ttl}` : ""}
      </span>
    </span>
  );
}

function formatRemaining(expiresAt: number | null): string | null {
  if (!expiresAt) return null;
  const remainingSec = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  if (remainingSec >= 3600) return `${Math.floor(remainingSec / 3600)}h`;
  if (remainingSec >= 60) return `${Math.floor(remainingSec / 60)}m`;
  return `${remainingSec}s`;
}
