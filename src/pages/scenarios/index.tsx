import { Link } from "react-router-dom";
import {
  FlaskIcon,
  PackageIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMailbox } from "@/services/mailbox";
import { PageHeader } from "@/components/page-header";
import { useViewStore } from "@/stores/use-view-store";
import { chaosIsActive, useChaos } from "@/services/chaos";

import { ChaosModeCard } from "./components/chaos-mode-card";
import { BounceRulesCard } from "./components/bounce-rules-card";

export default function ScenariosPage() {
  const mailboxId = useViewStore((s) => s.mailboxId);
  const { mailbox } = useMailbox(mailboxId);

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-6 py-5">
        <PageHeader
          icon={FlaskIcon}
          title="Scenarios"
          description="Inject failure conditions into a mailbox to test how your sender behaves under stress."
          action={mailbox ? <ChaosPill mailboxId={mailbox.id} /> : undefined}
        />

        {!mailbox ? (
          <NoMailboxState />
        ) : (
          <div className="flex flex-col gap-5">
            <ChaosModeCard mailbox={mailbox} />
            <BounceRulesCard mailbox={mailbox} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tiny status chip shown next to the page title — turns warning-tinted
 * when at least one chaos knob is engaged. Mirrors the StatusPill
 * convention used in webhooks/mailboxes for visual consistency.
 */
function ChaosPill({ mailboxId }: { mailboxId: string }) {
  const { chaos } = useChaos(mailboxId);
  const active = chaosIsActive(chaos);
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium tracking-tight",
        active
          ? "bg-warn/15 text-warn"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          active
            ? "bg-warn motion-safe:animate-[pulse-soft_1.8s_ease-in-out_infinite]"
            : "bg-muted-foreground/50",
        )}
      />
      {active ? "Chaos on" : "Chaos off"}
    </span>
  );
}

function NoMailboxState() {
  return (
    <div className="border-border/60 bg-card/30 flex flex-col items-center rounded-xl border px-6 py-14 text-center">
      <span className="bg-muted text-muted-foreground border-border/60 grid size-11 place-items-center rounded-xl border">
        <FlaskIcon size={18} weight="regular" />
      </span>
      <h2 className="text-foreground mt-3.5 text-[14px] font-semibold tracking-tight">
        Pick a mailbox first
      </h2>
      <p className="text-muted-foreground mt-1 max-w-xs text-[12.5px] leading-snug">
        Scenarios are scoped per mailbox. Create one or switch to an existing
        mailbox in the sidebar to get started.
      </p>
      <Button asChild size="sm" className="mt-4 gap-2 text-[12.5px]">
        <Link to="/mailboxes">
          <PackageIcon size={12} weight="bold" />
          Go to mailboxes
        </Link>
      </Button>
    </div>
  );
}
