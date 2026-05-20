import { TrayIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";

export function EmptyMailboxes() {
  return (
    <div className="border-border/60 bg-card/30 flex flex-col items-center rounded-xl border px-6 py-14 text-center">
      <span className="bg-muted text-muted-foreground border-border/60 grid size-11 place-items-center rounded-xl border">
        <TrayIcon size={18} weight="regular" />
      </span>
      <h2 className="text-foreground mt-3.5 text-[14px] font-semibold tracking-tight">
        No mailboxes yet
      </h2>
      <p className="text-muted-foreground mt-1 max-w-xs text-[12.5px] leading-snug">
        Create a mailbox to capture SMTP traffic from your app, tests, or CI.
      </p>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-xl border px-4 py-3">
      <WarningIcon
        size={16}
        weight="regular"
        className="text-destructive mt-px shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="text-destructive text-[12.5px] font-medium">
          Couldn't load mailboxes
        </div>
        <div className="text-destructive/80 mt-0.5 text-[11.5px] leading-snug">
          {message}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="text-[12px]"
      >
        Retry
      </Button>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <section className="border-border/60 overflow-hidden rounded-xl border">
      <div className="border-border/60 h-11 border-b" />
      <div className="border-border/60 bg-muted/10 h-9 border-b" />
      <ul className="divide-border/60 divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 px-3"
            style={{ height: 41 }}
          >
            <span className="bg-muted size-4 shrink-0 rounded-[4px]" />
            <span className="bg-muted size-2.5 shrink-0 rounded-[3px]" />
            <span className="bg-muted h-3 w-32 rounded" />
            <span className="bg-muted h-3 w-24 rounded" />
            <span className="bg-muted h-4 w-16 rounded-md" />
            <span className="bg-muted ml-auto h-3 w-12 rounded tabular-nums" />
          </li>
        ))}
      </ul>
    </section>
  );
}
