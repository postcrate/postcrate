import { useState } from "react";

import { useDialogsStore } from "@/stores/use-dialogs-store";
import { useProjectsStore } from "@/stores/use-projects-store";
import { useMailboxes, type Mailbox } from "@/services/mailbox";

import { StatsGrid } from "./components/stats-grid";
import { MailboxesHeader } from "./components/header";
import { MailboxTable } from "./components/mailbox-table";
import { MailboxFormDialog } from "./components/mailbox-form-dialog";
import { DeleteMailboxAlert } from "./components/delete-mailbox-alert";
import {
  EmptyMailboxes,
  ErrorBanner,
  TableSkeleton,
} from "./components/states";

export default function MailboxesPage() {
  const currentProjectId = useProjectsStore((s) => s.currentId);
  const { mailboxes, isLoading, error, refresh } =
    useMailboxes(currentProjectId);

  const openNewMailbox = useDialogsStore((s) => s.openNewMailbox);
  const [editing, setEditing] = useState<Mailbox | null>(null);
  const [deleting, setDeleting] = useState<Mailbox | null>(null);

  const list = mailboxes ?? [];

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-6 py-5">
        <MailboxesHeader mailboxes={list} onCreate={openNewMailbox} />

        <StatsGrid mailboxes={list} />

        {error ? (
          <ErrorBanner
            message={error instanceof Error ? error.message : "Unknown error"}
            onRetry={() => refresh()}
          />
        ) : null}

        {isLoading && list.length === 0 ? (
          <TableSkeleton />
        ) : list.length === 0 && !error ? (
          <EmptyMailboxes onCreate={openNewMailbox} />
        ) : (
          <MailboxTable
            mailboxes={list}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        )}
      </div>

      {/* Edit is still page-local — it needs the specific mailbox in
          scope and we don't want it competing with the global create. */}
      {editing ? (
        <MailboxFormDialog
          mode="edit"
          mailbox={editing}
          open={editing !== null}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      ) : null}
      <DeleteMailboxAlert
        mailbox={deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      />
    </div>
  );
}
