import { toast } from "sonner";
import {
  CopyIcon,
  PackageIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { type Mailbox } from "@/services/mailbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { connectionString } from "./mailbox-row";

type Props = {
  mailboxes: Mailbox[];
  onCreate: () => void;
};

export function MailboxesHeader({ mailboxes, onCreate }: Props) {
  const primary = mailboxes.find((m) => m.kind === "primary") ?? mailboxes[0];

  async function copyConnection() {
    if (!primary) {
      toast.error("No mailbox to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(connectionString(primary));
      toast.success("Connection copied", {
        description: connectionString(primary),
      });
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="bg-muted text-muted-foreground border-border/60 grid size-9 place-items-center rounded-lg border">
          <PackageIcon size={16} weight="regular" />
        </span>
        <div className="min-w-0">
          <h1 className="text-foreground text-[17px] leading-none font-semibold tracking-tight">
            Mailboxes
          </h1>
          <p className="text-muted-foreground mt-1 text-[12px] leading-snug">
            Manage the listeners your apps and CI talk to.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={copyConnection}
              disabled={!primary}
              aria-label="Copy primary connection string"
            >
              <CopyIcon size={13} weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {primary
              ? `Copy ${connectionString(primary)}`
              : "No mailbox to copy"}
          </TooltipContent>
        </Tooltip>
        <Button size="sm" onClick={onCreate} className="gap-2 text-[12.5px]">
          <PlusIcon size={12} weight="bold" />
          New mailbox
          <Kbd className="bg-foreground/10 text-primary-foreground/70 h-4 text-[10px]">
            ⌘N
          </Kbd>
        </Button>
      </div>
    </header>
  );
}
