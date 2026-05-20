import { useState } from "react";
import {
  EnvelopeSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import { Skeleton } from "@/components/ui/skeleton";
import { useMailboxes, type Mailbox } from "@/services/mailbox";
import {
  deleteBounceRule,
  useBounceRules,
  type BounceRule,
} from "@/services/bounce-rules";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

import { BounceRuleDialog } from "./bounce-rule-dialog";

/**
 * Bounce rules tab on the Mailboxes page. Rules are scoped per mailbox,
 * so the panel renders a per-mailbox accordion. Each item lazily fetches
 * its own list via `useBounceRules`.
 */
export function BounceRulesPanel() {
  const { mailboxes, isLoading } = useMailboxes(null);
  const list = mailboxes ?? [];

  return (
    <div className="flex flex-col gap-3">
      <PanelHeader description="Reject mail to an address pattern with a synthetic SMTP response. Use this to test your sender's retry and dead-letter paths." />

      {isLoading && mailboxes === undefined ? (
        <MailboxListSkeleton />
      ) : list.length === 0 ? (
        <NoMailboxesEmpty />
      ) : (
        <Accordion
          type="multiple"
          className="border-border/60 divide-border/60 divide-y rounded-lg border"
        >
          {list.map((m) => (
            <MailboxBounceGroup key={m.id} mailbox={m} />
          ))}
        </Accordion>
      )}
    </div>
  );
}

function PanelHeader({ description }: { description: string }) {
  return (
    <p className="text-muted-foreground max-w-prose text-[12px] leading-snug">
      {description}
    </p>
  );
}

type GroupProps = {
  mailbox: Mailbox;
};

function MailboxBounceGroup({ mailbox }: GroupProps) {
  const [editing, setEditing] = useState<BounceRule | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BounceRule | null>(null);

  const { rules, isLoading } = useBounceRules(mailbox.id);
  const count = rules?.length ?? 0;

  return (
    <>
      <AccordionItem value={mailbox.id} className="px-3">
        <AccordionTrigger className="py-2.5 hover:no-underline">
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="text-foreground text-[13px] font-medium">
              {mailbox.name}
            </span>
            <span className="text-muted-foreground/80 font-mono text-[11px]">
              :{mailbox.port}
            </span>
            {!isLoading ? (
              <span
                className={cn(
                  "border-border/60 bg-muted/50 text-muted-foreground",
                  "ml-auto mr-3 inline-flex h-5 items-center rounded-md border px-1.5 text-[10.5px] tabular-nums",
                )}
              >
                {count} {count === 1 ? "rule" : "rules"}
              </span>
            ) : null}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-3">
          {isLoading && rules === undefined ? (
            <RuleSkeleton />
          ) : (rules ?? []).length === 0 ? (
            <p className="text-muted-foreground py-1 text-[11.5px]">
              No rules yet. Add one to simulate a bounce on incoming mail.
            </p>
          ) : (
            <ul className="border-border/60 divide-border/60 divide-y rounded-lg border">
              {rules!.map((r) => (
                <BounceRuleRow
                  key={r.id ?? r.addressPattern}
                  rule={r}
                  onEditClick={() => setEditing(r)}
                  onDeleteClick={() => setConfirmDelete(r)}
                />
              ))}
            </ul>
          )}

          <div className="mt-2.5 flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 px-2.5 text-[11.5px]"
              onClick={() => setCreating(true)}
            >
              <PlusIcon size={11} weight="bold" />
              Add rule
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>

      <BounceRuleDialog
        open={creating}
        onOpenChange={setCreating}
        mailboxId={mailbox.id}
      />
      <BounceRuleDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        mailboxId={mailbox.id}
        rule={editing}
      />
      <DeleteBounceAlert
        rule={confirmDelete}
        mailboxId={mailbox.id}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      />
    </>
  );
}

type RowProps = {
  rule: BounceRule;
  onEditClick: () => void;
  onDeleteClick: () => void;
};

function BounceRuleRow({ rule, onEditClick, onDeleteClick }: RowProps) {
  return (
    <li className="group flex items-center gap-3 px-3 py-2">
      <KindChip kind={rule.bounceKind} />
      <button
        type="button"
        onClick={onEditClick}
        className="text-foreground hover:text-foreground/80 min-w-0 flex-1 truncate text-left font-mono text-[11.5px]"
      >
        {rule.addressPattern}
      </button>
      <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
        {rule.smtpCode}
      </span>
      {rule.enabled === false ? (
        <span className="text-muted-foreground/80 shrink-0 text-[10.5px] uppercase tracking-wider">
          Off
        </span>
      ) : null}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Delete rule"
        onClick={onDeleteClick}
        className="text-muted-foreground hover:text-destructive size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <TrashIcon size={13} weight="regular" />
      </Button>
    </li>
  );
}

function KindChip({ kind }: { kind: BounceRule["bounceKind"] }) {
  const styles =
    kind === "hard"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : "border-warn/40 bg-warn/10 text-warn";
  return (
    <span
      className={cn(
        styles,
        "inline-flex h-5 w-12 shrink-0 items-center justify-center rounded-md border text-[10.5px] font-medium uppercase tracking-wider",
      )}
    >
      {kind}
    </span>
  );
}

function MailboxListSkeleton() {
  return (
    <ul className="border-border/60 divide-border/60 divide-y rounded-lg border">
      {Array.from({ length: 2 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="ml-auto h-5 w-12 rounded-md" />
        </li>
      ))}
    </ul>
  );
}

function RuleSkeleton() {
  return (
    <ul className="border-border/60 divide-border/60 divide-y rounded-lg border">
      {Array.from({ length: 1 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="h-5 w-12 rounded-md" />
          <Skeleton className="h-3.5 flex-1" />
        </li>
      ))}
    </ul>
  );
}

function NoMailboxesEmpty() {
  return (
    <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed px-6 py-10 text-center">
      <EnvelopeSimpleIcon
        size={20}
        weight="regular"
        className="text-muted-foreground/70"
      />
      <div>
        <p className="text-foreground text-[13px] font-medium">
          No mailboxes yet
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-[12px] leading-snug">
          Bounce rules attach to a mailbox. Switch to the Mailboxes tab to
          create one first.
        </p>
      </div>
    </div>
  );
}

function DeleteBounceAlert({
  rule,
  mailboxId,
  onOpenChange,
}: {
  rule: BounceRule | null;
  mailboxId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!rule?.id) return;
    setPending(true);
    try {
      await deleteBounceRule(rule.id, mailboxId);
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't delete bounce rule");
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
          <AlertDialogTitle>Delete bounce rule?</AlertDialogTitle>
          <AlertDialogDescription>
            {rule ? (
              <>
                Mail matching{" "}
                <span className="text-foreground font-mono">
                  {rule.addressPattern}
                </span>{" "}
                will be accepted again.
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
