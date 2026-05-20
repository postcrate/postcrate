import { useState } from "react";

import { useDialogsStore } from "@/stores/use-dialogs-store";
import { useProjectsStore } from "@/stores/use-projects-store";
import { useMailboxes, type Mailbox } from "@/services/mailbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MailboxesHeader } from "./components/header";
import { MailboxTable } from "./components/mailbox-table";
import { ForwardingPanel } from "./components/forwarding-panel";
import { BounceRulesPanel } from "./components/bounce-rules-panel";
import { MailboxFormDialog } from "./components/mailbox-form-dialog";
import { DeleteMailboxAlert } from "./components/delete-mailbox-alert";
import {
  EmptyMailboxes,
  ErrorBanner,
  TableSkeleton,
} from "./components/states";

type Tab = "mailboxes" | "forwarding" | "bounces";

export default function MailboxesPage() {
  const currentProjectId = useProjectsStore((s) => s.currentId);
  const { mailboxes, isLoading, error, refresh } =
    useMailboxes(currentProjectId);

  const openNewMailbox = useDialogsStore((s) => s.openNewMailbox);
  const [editing, setEditing] = useState<Mailbox | null>(null);
  const [deleting, setDeleting] = useState<Mailbox | null>(null);
  const [tab, setTab] = useState<Tab>("mailboxes");

  const list = mailboxes ?? [];

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-6 py-5">
        <MailboxesHeader mailboxes={list} onCreate={openNewMailbox} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="h-8 self-start">
            <TabsTrigger value="mailboxes" className="text-[12.5px]">
              Mailboxes
            </TabsTrigger>
            <TabsTrigger value="forwarding" className="text-[12.5px]">
              Forwarding
            </TabsTrigger>
            <TabsTrigger value="bounces" className="text-[12.5px]">
              Bounce rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mailboxes" className="mt-5 flex flex-col gap-5">
            {error ? (
              <ErrorBanner
                message={
                  error instanceof Error ? error.message : "Unknown error"
                }
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
          </TabsContent>

          <TabsContent value="forwarding" className="mt-5">
            <ForwardingPanel />
          </TabsContent>

          <TabsContent value="bounces" className="mt-5">
            <BounceRulesPanel />
          </TabsContent>
        </Tabs>
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
