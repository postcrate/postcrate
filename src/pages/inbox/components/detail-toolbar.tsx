import { toast } from "sonner";
import { useState } from "react";
import {
  ArrowBendUpRightIcon,
  CopyIcon,
  PaperPlaneTiltIcon,
  PushPinSimpleIcon,
  StarIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { commands } from "@/lib/bridge/bindings";
import { useViewStore } from "@/stores/use-view-store";
import { reportIpcError, unwrap } from "@/lib/bridge/ipc";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteEmail,
  setEmailPinned,
  setEmailStarred,
  type EmailDetail,
} from "@/services/email";
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

import { ReplayDialog } from "./replay-dialog";
import { ReleaseDialog } from "./release-dialog";

type Props = {
  email: EmailDetail;
};

/** Per-email actions: star, pin, copy raw, release, replay, delete. */
export function DetailToolbar({ email }: Props) {
  const setEmailId = useViewStore((s) => s.setEmailId);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);

  async function toggleStar() {
    try {
      await setEmailStarred(email.id, !email.starred);
    } catch (err) {
      reportIpcError(err, "Couldn't toggle star");
    }
  }

  async function togglePin() {
    try {
      await setEmailPinned(email.id, !email.pinned);
    } catch (err) {
      reportIpcError(err, "Couldn't toggle pin");
    }
  }

  async function copyRaw() {
    try {
      const raw = unwrap(await commands.getEmailRaw(email.id));
      await navigator.clipboard.writeText(raw);
      toast.success("Raw source copied");
    } catch (err) {
      reportIpcError(err, "Couldn't copy raw source");
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteEmail(email.id);
      setEmailId(null);
      setConfirming(false);
      toast.success("Message deleted");
    } catch (err) {
      reportIpcError(err, "Couldn't delete message");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="border-border/60 flex items-center gap-1 border-b px-5 py-2">
      <ToolButton
        label={email.starred ? "Unstar" : "Star"}
        shortcut="s"
        active={email.starred}
        onClick={toggleStar}
      >
        <StarIcon
          size={14}
          weight={email.starred ? "fill" : "regular"}
          className={cn(email.starred && "text-warn")}
        />
      </ToolButton>
      <ToolButton
        label={email.pinned ? "Unpin" : "Pin"}
        shortcut="p"
        active={email.pinned}
        onClick={togglePin}
      >
        <PushPinSimpleIcon
          size={14}
          weight={email.pinned ? "fill" : "regular"}
          className={cn(email.pinned && "text-info")}
        />
      </ToolButton>

      <Divider />

      <ToolButton label="Copy raw source" onClick={copyRaw}>
        <CopyIcon size={14} weight="regular" />
      </ToolButton>
      <ToolButton label="Release to relay" onClick={() => setReleaseOpen(true)}>
        <PaperPlaneTiltIcon size={14} weight="regular" />
      </ToolButton>
      <ToolButton label="Replay to mailbox" onClick={() => setReplayOpen(true)}>
        <ArrowBendUpRightIcon size={14} weight="regular" />
      </ToolButton>

      <div className="ml-auto">
        <ToolButton
          label="Delete"
          shortcut="⌫"
          destructive
          onClick={() => setConfirming(true)}
        >
          <TrashIcon size={14} weight="regular" />
        </ToolButton>
      </div>

      <ReleaseDialog
        emailId={email.id}
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
      />
      <ReplayDialog
        emailId={email.id}
        sourceMailboxId={email.mailboxId}
        open={replayOpen}
        onOpenChange={setReplayOpen}
      />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              The message will be removed from the mailbox permanently,
              including any attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ToolButton({
  label,
  shortcut,
  active,
  destructive,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  destructive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className={cn(
            active && "text-foreground bg-muted",
            destructive &&
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-1.5">
        <span>{label}</span>
        {shortcut ? <Kbd>{shortcut}</Kbd> : null}
      </TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <span className="bg-border/60 mx-1 h-4 w-px shrink-0" />;
}
