import { useEffect } from "react";

import { useViewStore } from "@/stores/use-view-store";
import { markEmailRead, useEmail } from "@/services/email";
import { IpcCallError, reportIpcError } from "@/lib/bridge/ipc";

import { DetailTabs } from "./detail-tabs";
import { DetailNote } from "./detail-note";
import { DetailEmpty } from "./detail-empty";
import { DetailHeader } from "./detail-header";
import { DetailToolbar } from "./detail-toolbar";
import { DetailAttachments } from "./detail-attachments";

type Props = {
  emailId: string | null;
};

/**
 * Right pane router. Loads the full email by id and renders the
 * header + attachments + body tabs. Handles the "selection is stale"
 * case by clearing `emailId` when the engine 404s.
 */
export function DetailPanel({ emailId }: Props) {
  const setEmailId = useViewStore((s) => s.setEmailId);
  const { email, isLoading, error } = useEmail(emailId);

  // If the selected email disappeared (deleted in another window, or
  // its mailbox was purged), drop the selection so the pane reverts to
  // the empty placeholder.
  useEffect(() => {
    if (!error) return;
    const code = error instanceof IpcCallError ? error.code : undefined;
    if (code === "email_not_found" || code === "not_found") {
      setEmailId(null);
    }
  }, [error, setEmailId]);

  useEffect(() => {
    if (!email || email.read) return;
    markEmailRead(email.id, true).catch((err) =>
      reportIpcError(err, "Couldn't mark as read"),
    );
  }, [email?.id, email?.read]);

  if (!emailId) return <DetailEmpty />;

  if (isLoading && !email) {
    return (
      <p className="text-muted-foreground flex h-full items-center justify-center text-[12.5px]">
        Loading…
      </p>
    );
  }

  if (error || !email) {
    return (
      <div className="text-destructive flex h-full items-center justify-center px-6 text-center text-[12.5px]">
        {error instanceof Error ? error.message : "Couldn't load this message"}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DetailHeader email={email} />
      <DetailToolbar email={email} />
      <DetailAttachments emailId={email.id} attachments={email.attachments} />
      <DetailTabs email={email} />
      <DetailNote emailId={email.id} initialNote={email.note} />
    </div>
  );
}
