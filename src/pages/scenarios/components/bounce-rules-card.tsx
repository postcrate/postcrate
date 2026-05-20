import { useState } from "react";
import { EnvelopeSimpleIcon, PlusIcon, XIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import { type Mailbox } from "@/services/mailbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteBounceRule,
  useBounceRules,
  type BounceRule,
} from "@/services/bounce-rules";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type Props = {
  mailbox: Mailbox;
};

export function BounceRulesCard({ mailbox }: Props) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BounceRule | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BounceRule | null>(null);

  const { rules, isLoading } = useBounceRules(mailbox.id);
  const list = rules ?? [];

  return (
    <>
      <section className="border-border/60 overflow-hidden rounded-xl border">
        <header className="border-border/60 flex items-center gap-3 border-b px-4 py-3">
          <span
            aria-hidden
            className="bg-muted text-muted-foreground/80 grid size-6 shrink-0 place-items-center rounded-md"
          >
            <EnvelopeSimpleIcon size={13} weight="regular" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground text-[13.5px] font-semibold leading-none tracking-tight">
              Bounce-marked addresses
            </h2>
            <p className="text-muted-foreground mt-1 truncate text-[11.5px]">
              {list.length === 0
                ? "Pretend specific recipients fail at SMTP time"
                : `${list.length} ${list.length === 1 ? "rule" : "rules"} applied to incoming mail`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreating(true)}
            className="gap-2 text-[12.5px]"
          >
            <PlusIcon size={12} weight="bold" />
            Add address
          </Button>
        </header>

        {isLoading && rules === undefined ? (
          <RowsSkeleton />
        ) : list.length === 0 ? (
          <EmptyRules />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <Th className="w-32 pl-4">Kind</Th>
                <Th>Address</Th>
                <Th className="w-72">SMTP response</Th>
                <Th className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <BounceRow
                  key={r.id ?? r.addressPattern}
                  rule={r}
                  onEditClick={() => setEditing(r)}
                  onDeleteClick={() => setConfirmDelete(r)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </section>

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

function BounceRow({ rule, onEditClick, onDeleteClick }: RowProps) {
  return (
    <TableRow className="group">
      <TableCell className="py-2.5 pl-4">
        <KindChip kind={rule.bounceKind} />
      </TableCell>
      <TableCell className="py-2.5">
        <button
          type="button"
          onClick={onEditClick}
          className="text-foreground hover:text-foreground/80 truncate font-mono text-[12px]"
        >
          {rule.addressPattern}
        </button>
      </TableCell>
      <TableCell className="py-2.5">
        <span className="text-foreground font-mono text-[11.5px]">
          <span className="text-muted-foreground tabular-nums">
            {rule.smtpCode}
          </span>{" "}
          {rule.smtpMessage}
        </span>
      </TableCell>
      <TableCell className="py-2.5 pr-3 text-right">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Delete bounce rule"
          onClick={onDeleteClick}
          className="text-muted-foreground hover:text-destructive size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <XIcon size={13} weight="regular" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function KindChip({ kind }: { kind: BounceRule["bounceKind"] }) {
  const styles =
    kind === "hard"
      ? "bg-destructive/12 text-destructive"
      : "bg-warn/15 text-warn";
  const dot = kind === "hard" ? "bg-destructive" : "bg-warn";
  return (
    <span
      className={cn(
        styles,
        "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium tracking-tight",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
      {kind}-bounce
    </span>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={cn(
        "text-muted-foreground/70 h-9 text-[10.5px] font-medium tracking-wider uppercase",
        className,
      )}
    >
      {children}
    </TableHead>
  );
}

function RowsSkeleton() {
  return (
    <ul className="divide-border/60 divide-y">
      {Array.from({ length: 2 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 px-4"
          style={{ height: 41 }}
        >
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="ml-auto h-3 w-48" />
        </li>
      ))}
    </ul>
  );
}

function EmptyRules() {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="bg-muted text-muted-foreground border-border/60 grid size-10 place-items-center rounded-xl border">
        <EnvelopeSimpleIcon size={16} weight="regular" />
      </span>
      <h3 className="text-foreground mt-3 text-[13px] font-semibold tracking-tight">
        No bounce rules yet
      </h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-[11.5px] leading-snug">
        Reject mail to a specific address with a fake SMTP code. Useful for
        testing retry and dead-letter logic.
      </p>
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
