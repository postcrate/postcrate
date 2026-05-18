import { m } from "motion/react";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { TopBar } from "@/components/top-bar";
import { Sidebar } from "@/components/sidebar/sidebar";
import { useDialogsStore } from "@/stores/use-dialogs-store";
import { MailboxFormDialog } from "@/pages/mailboxes/components/mailbox-form-dialog";

export default function MainLayout() {
  const location = useLocation();
  const newMailboxOpen = useDialogsStore((s) => s.newMailboxOpen);
  const openNewMailbox = useDialogsStore((s) => s.openNewMailbox);
  const setNewMailboxOpen = useDialogsStore((s) => s.setNewMailboxOpen);

  // Global ⌘N / Ctrl+N — open the new-mailbox dialog from anywhere in
  // the main app. Skip when the user is typing into a field so the
  // shortcut never steals "newline" from textareas.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== "n") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      openNewMailbox();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openNewMailbox]);

  return (
    <div className="text-foreground flex h-screen overflow-hidden">
      <Sidebar />
      <div className="bg-background flex min-w-0 flex-1 flex-col">
        <TopBar onOpenPalette={() => undefined} />
        <m.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <Outlet />
        </m.div>
      </div>

      <MailboxFormDialog
        open={newMailboxOpen}
        onOpenChange={setNewMailboxOpen}
      />
    </div>
  );
}
