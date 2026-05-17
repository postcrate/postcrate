import { CaretUpDownIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { useViewStore } from "@/stores/use-view-store";
import { MAILBOXES, type Mailbox, type MailboxKind } from "@/data/mailboxes";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const KIND_SWATCH: Record<MailboxKind, string> = {
  primary: "bg-brand",
  ephemeral: "bg-info",
  shared: "bg-muted-foreground/60",
};

export function MailboxSwitcher() {
  const mailboxId = useViewStore((s) => s.mailboxId);
  const setMailboxId = useViewStore((s) => s.setMailboxId);
  const setView = useViewStore((s) => s.setView);

  const current = MAILBOXES.find((m) => m.id === mailboxId) ?? MAILBOXES[0];

  return (
    <div className="px-2 pt-1 pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent",
            "flex h-11 w-full items-center gap-2 rounded-md px-2 text-left",
            "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          )}
        >
          <Swatch kind={current.kind} />
          <MailboxLabel mailbox={current} />
          <CaretUpDownIcon
            size={12}
            weight="bold"
            className="text-muted-foreground/70 shrink-0"
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
          {MAILBOXES.map((m) => {
            const isCurrent = m.id === mailboxId;
            return (
              <DropdownMenuItem
                key={m.id}
                onSelect={() => {
                  setMailboxId(m.id);
                  setView("inbox");
                }}
                className="h-9 gap-2 px-2"
              >
                <Swatch kind={m.kind} />
                <MailboxLabel mailbox={m} />
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
            onSelect={() => setView("mailboxes")}
            className="text-muted-foreground h-8 gap-2 px-2 text-[12.5px]"
          >
            <PlusIcon size={12} weight="bold" />
            <span>New ephemeral mailbox</span>
            <Kbd className="ml-auto h-4 text-[10px]">⌘N</Kbd>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
  return (
    <span className="flex min-w-0 flex-1 flex-col leading-tight">
      <span className="text-foreground truncate font-mono text-[12.5px] font-medium">
        {mailbox.name}
      </span>
      <span className="text-muted-foreground/70 font-mono text-[10px] tabular-nums">
        :{mailbox.port}
        {mailbox.ttl ? ` · ${mailbox.ttl}` : ""}
      </span>
    </span>
  );
}
