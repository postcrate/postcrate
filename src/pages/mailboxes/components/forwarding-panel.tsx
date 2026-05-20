import { useState } from "react";
import {
  ArrowRightIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import { Skeleton } from "@/components/ui/skeleton";
import { useMailboxes, type Mailbox } from "@/services/mailbox";
import {
  deleteForwardingRule,
  useForwarding,
  type ForwardingRule,
} from "@/services/forwarding";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ForwardingFormDialog } from "./forwarding-form-dialog";

/**
 * Forwarding rules tab on the Mailboxes page. Renders a list of rules
 * (global + per-mailbox), with create / delete affordances. Designed to
 * sit inside a `<TabsContent>` and share width with the mailbox table.
 */
export function ForwardingPanel() {
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ForwardingRule | null>(
    null,
  );

  const { rules, isLoading } = useForwarding();
  const { mailboxes } = useMailboxes(null);
  const mailboxById = new Map((mailboxes ?? []).map((m) => [m.id, m] as const));

  const list = rules ?? [];

  return (
    <>
      <div className="flex flex-col gap-3">
        <PanelHeader
          description="Relay captured email to upstream SMTP. Use this for staged delivery or pre-prod review."
          action={
            <Button
              size="sm"
              onClick={() => setCreating(true)}
              className="gap-2 text-[12.5px]"
            >
              <PlusIcon size={12} weight="bold" />
              New rule
            </Button>
          }
        />

        {isLoading && rules === undefined ? (
          <SkeletonList count={2} />
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="border-border/60 divide-border/60 divide-y rounded-lg border">
            {list.map((r) => (
              <ForwardingRow
                key={r.id}
                rule={r}
                mailbox={
                  r.mailboxId ? mailboxById.get(r.mailboxId) ?? null : null
                }
                onDeleteClick={() => setConfirmDelete(r)}
              />
            ))}
          </ul>
        )}
      </div>

      <ForwardingFormDialog open={creating} onOpenChange={setCreating} />
      <DeleteForwardingAlert
        rule={confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      />
    </>
  );
}

function PanelHeader({
  description,
  action,
}: {
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-muted-foreground max-w-prose text-[12px] leading-snug">
        {description}
      </p>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

type RowProps = {
  rule: ForwardingRule;
  mailbox: Mailbox | null;
  onDeleteClick: () => void;
};

function ForwardingRow({ rule, mailbox, onDeleteClick }: RowProps) {
  return (
    <li className="group flex items-start gap-3 px-3 py-2.5">
      <ScopeChip mailboxId={rule.mailboxId} mailbox={mailbox} />
      <ArrowRightIcon
        size={11}
        weight="bold"
        className="text-muted-foreground/70 mt-1 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {rule.targetAddresses.slice(0, 3).map((addr) => (
            <span
              key={addr}
              className="border-border/60 bg-muted/50 text-foreground inline-flex h-5 items-center rounded-md border px-1.5 font-mono text-[11px]"
            >
              {addr}
            </span>
          ))}
          {rule.targetAddresses.length > 3 ? (
            <span className="text-muted-foreground inline-flex h-5 items-center text-[11px]">
              +{rule.targetAddresses.length - 3} more
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground/80 mt-1 font-mono text-[10.5px]">
          via {rule.relay.host}:{rule.relay.port}
        </p>
      </div>
      {!rule.enabled ? (
        <span className="text-muted-foreground/80 shrink-0 self-center text-[10.5px] uppercase tracking-wider">
          Disabled
        </span>
      ) : null}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Delete forwarding rule"
        onClick={onDeleteClick}
        className="text-muted-foreground hover:text-destructive size-7 shrink-0 self-center opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <TrashIcon size={13} weight="regular" />
      </Button>
    </li>
  );
}

function ScopeChip({
  mailboxId,
  mailbox,
}: {
  mailboxId: string | null;
  mailbox: Mailbox | null;
}) {
  if (mailboxId === null) {
    return (
      <span
        className={cn(
          "border-border/60 bg-muted/50 text-muted-foreground",
          "mt-0.5 inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px]",
        )}
      >
        All mailboxes
      </span>
    );
  }
  if (!mailbox) {
    return (
      <span
        className={cn(
          "border-destructive/40 bg-destructive/10 text-destructive",
          "mt-0.5 inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px]",
        )}
      >
        Unknown mailbox
      </span>
    );
  }
  return (
    <span
      className={cn(
        "border-border/60 bg-muted/50 text-foreground",
        "mt-0.5 inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px]",
      )}
    >
      {mailbox.name}
      <span className="text-muted-foreground font-mono">:{mailbox.port}</span>
    </span>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <ul className="border-border/60 divide-border/60 divide-y rounded-lg border">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-3.5 flex-1" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed px-6 py-12 text-center">
      <PaperPlaneTiltIcon
        size={22}
        weight="regular"
        className="text-muted-foreground/70"
      />
      <div>
        <p className="text-foreground text-[13px] font-medium">
          No forwarding rules yet
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-[12px] leading-snug">
          Relay matched email to an upstream SMTP server.
        </p>
      </div>
    </div>
  );
}

function DeleteForwardingAlert({
  rule,
  onOpenChange,
}: {
  rule: ForwardingRule | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!rule) return;
    setPending(true);
    try {
      await deleteForwardingRule(rule.id);
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't delete forwarding rule");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={rule !== null}
      onOpenChange={(o) => !o && onOpenChange(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete forwarding rule?</AlertDialogTitle>
          <AlertDialogDescription>
            {rule ? (
              <>
                Mail will no longer be relayed to{" "}
                <span className="text-foreground font-mono">
                  {rule.relay.host}:{rule.relay.port}
                </span>
                .
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="sm" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={confirm}
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
