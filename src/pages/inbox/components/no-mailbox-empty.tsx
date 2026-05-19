import { Link } from "react-router-dom";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";

/**
 * Shown when no mailbox is selected. Visually mirrors `EmptyMailboxes`
 * so the empty surface feels consistent across the app.
 */
export function NoMailboxEmpty() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6">
      <div className="border-border/60 bg-card/30 flex w-full max-w-md flex-col items-center rounded-xl border px-6 py-14 text-center">
        <span className="bg-muted text-muted-foreground border-border/60 grid size-11 place-items-center rounded-xl border">
          <PackageIcon size={18} weight="regular" />
        </span>
        <h2 className="text-foreground mt-3.5 text-[14px] font-semibold tracking-tight">
          Pick a mailbox to start
        </h2>
        <p className="text-muted-foreground mt-1 max-w-xs text-[12.5px] leading-snug">
          Captured mail lives inside a mailbox. Open one from the sidebar
          or create a new one to begin testing.
        </p>
        <Button asChild size="sm" className="mt-4 text-[12.5px]">
          <Link to="/mailboxes">Manage mailboxes</Link>
        </Button>
      </div>
    </div>
  );
}
