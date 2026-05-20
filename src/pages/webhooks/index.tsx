import { useMemo, useState } from "react";
import {
  KeyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  WebhooksLogoIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reportIpcError } from "@/lib/bridge/ipc";
import { PageHeader } from "@/components/page-header";
import { useMailboxes, type Mailbox } from "@/services/mailbox";
import {
  deleteWebhook,
  useWebhooks,
  type Webhook,
} from "@/services/webhooks";
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

import { WebhookFormDialog } from "./components/webhook-form-dialog";

export default function WebhooksPage() {
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Webhook | null>(null);
  const [query, setQuery] = useState("");

  const { webhooks, isLoading, error, refresh } = useWebhooks();
  const { mailboxes } = useMailboxes(null);
  const mailboxById = useMemo(
    () => new Map((mailboxes ?? []).map((m) => [m.id, m] as const)),
    [mailboxes],
  );

  const list = webhooks ?? [];
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((w) => {
      if (w.url.toLowerCase().includes(q)) return true;
      const mb = w.mailboxId ? mailboxById.get(w.mailboxId) : null;
      if (mb?.name.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [list, query, mailboxById]);

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-6 py-5">
        <PageHeader
          icon={WebhooksLogoIcon}
          title="Webhooks"
          description="POST a JSON payload to a URL whenever new mail arrives."
          action={
            <Button
              size="sm"
              onClick={() => setCreating(true)}
              className="gap-2 text-[12.5px]"
            >
              <PlusIcon size={12} weight="bold" />
              New webhook
            </Button>
          }
        />

        {error ? (
          <ErrorBanner
            message={error instanceof Error ? error.message : "Unknown error"}
            onRetry={() => refresh()}
          />
        ) : null}

        {isLoading && webhooks === undefined ? (
          <TableSkeleton />
        ) : list.length === 0 && !error ? (
          <EmptyWebhooks />
        ) : (
          <section className="border-border/60 overflow-hidden rounded-xl border">
            <header className="border-border/60 flex h-11 items-center gap-3 border-b px-3">
              <SearchInput value={query} onChange={setQuery} />
            </header>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <Th className="w-44 pl-3">Scope</Th>
                  <Th>URL</Th>
                  <Th className="w-16">Auth</Th>
                  <Th className="w-24">Status</Th>
                  <Th className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <td
                      colSpan={5}
                      className="text-muted-foreground py-10 text-center text-[12.5px]"
                    >
                      No webhooks matching &ldquo;{query}&rdquo;.
                    </td>
                  </TableRow>
                ) : (
                  visible.map((w) => (
                    <WebhookRow
                      key={w.id}
                      webhook={w}
                      mailbox={
                        w.mailboxId
                          ? mailboxById.get(w.mailboxId) ?? null
                          : null
                      }
                      onDeleteClick={() => setConfirmDelete(w)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </section>
        )}
      </div>

      <WebhookFormDialog open={creating} onOpenChange={setCreating} />
      <DeleteWebhookAlert
        webhook={confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      />
    </div>
  );
}

type RowProps = {
  webhook: Webhook;
  mailbox: Mailbox | null;
  onDeleteClick: () => void;
};

function WebhookRow({ webhook, mailbox, onDeleteClick }: RowProps) {
  return (
    <TableRow className="group">
      <TableCell className="py-2.5 pl-3">
        <ScopeChip mailboxId={webhook.mailboxId} mailbox={mailbox} />
      </TableCell>
      <TableCell className="py-2.5">
        <span className="text-foreground block truncate font-mono text-[12px]">
          {webhook.url}
        </span>
      </TableCell>
      <TableCell className="py-2.5">
        {webhook.authHeader ? (
          <KeyIcon
            size={12}
            weight="regular"
            className="text-muted-foreground"
            aria-label="Has authorization header"
          />
        ) : (
          <span className="text-muted-foreground/40 text-[11px]">—</span>
        )}
      </TableCell>
      <TableCell className="py-2.5">
        <StatusPill enabled={webhook.enabled} />
      </TableCell>
      <TableCell className="py-2.5 pr-3 text-right">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Delete webhook"
          onClick={onDeleteClick}
          className="text-muted-foreground hover:text-destructive size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <TrashIcon size={13} weight="regular" />
        </Button>
      </TableCell>
    </TableRow>
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
          "inline-flex h-5 items-center gap-1 rounded-md border px-1.5 text-[11px]",
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
          "inline-flex h-5 items-center gap-1 rounded-md border px-1.5 text-[11px]",
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
        "inline-flex h-5 items-center gap-1 rounded-md border px-1.5 text-[11px]",
      )}
    >
      <span className="truncate">{mailbox.name}</span>
      <span className="text-muted-foreground font-mono">:{mailbox.port}</span>
    </span>
  );
}

/**
 * Text-only pill — color carries the state. Mirrors
 * `pages/mailboxes/components/status.tsx` so the runtime-state badge
 * looks the same across every list view in the app.
 */
function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium tracking-tight",
        enabled ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {enabled ? "Active" : "Paused"}
    </span>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative w-56">
      <MagnifyingGlassIcon
        size={12}
        weight="regular"
        className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="Filter by URL or mailbox"
        className="h-7 pr-6 pl-6 text-[12px] placeholder:text-[12px]"
      />
    </div>
  );
}

/**
 * Bespoke skeleton that mirrors the real table's silhouette (toolbar
 * bar, column-header bar, then row strips). Avoids the "stack of grey
 * pills" generic-Skeleton look that doesn't match the loaded state.
 */
function TableSkeleton() {
  return (
    <section className="border-border/60 overflow-hidden rounded-xl border">
      <div className="border-border/60 h-11 border-b" />
      <div className="border-border/60 bg-muted/10 h-9 border-b" />
      <ul className="divide-border/60 divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 px-3"
            style={{ height: 41 }}
          >
            <span className="bg-muted h-4 w-32 rounded-md" />
            <span className="bg-muted h-3 flex-1 rounded" />
            <span className="bg-muted h-3 w-3 rounded" />
            <span className="bg-muted h-4 w-12 rounded-full" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyWebhooks() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="text-muted-foreground/80">
        <WebhooksLogoIcon size={22} weight="regular" />
      </span>
      <h2 className="text-foreground mt-3 text-[14px] font-semibold tracking-tight">
        No webhooks yet
      </h2>
      <p className="text-muted-foreground mt-1 max-w-xs text-[12.5px] leading-snug">
        Forward every captured email to your own service — Slack, a CI hook, a
        dev relay.
      </p>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-xl border px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-destructive text-[12.5px] font-medium">
          Couldn&apos;t load webhooks
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

function DeleteWebhookAlert({
  webhook,
  onOpenChange,
}: {
  webhook: Webhook | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!webhook) return;
    setPending(true);
    try {
      await deleteWebhook(webhook.id);
      onOpenChange(false);
    } catch (err) {
      reportIpcError(err, "Couldn't delete webhook");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={webhook !== null}
      onOpenChange={(o) => !o && onOpenChange(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
          <AlertDialogDescription>
            {webhook ? (
              <>
                Captured email will no longer be forwarded to{" "}
                <span className="text-foreground font-mono">{webhook.url}</span>
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
