import { m } from "motion/react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { TopBar } from "@/components/top-bar";
import { Sidebar } from "@/components/sidebar/sidebar";
import { useDialogsStore } from "@/stores/use-dialogs-store";
import { CommandPalette } from "@/components/command-palette";
import { MailboxFormDialog } from "@/pages/mailboxes/components/mailbox-form-dialog";

export default function MainLayout() {
  const location = useLocation();
  const newMailboxOpen = useDialogsStore((s) => s.newMailboxOpen);
  const openNewMailbox = useDialogsStore((s) => s.openNewMailbox);
  const setNewMailboxOpen = useDialogsStore((s) => s.setNewMailboxOpen);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global shortcuts. ⌘N opens the new-mailbox dialog. ⌘K opens the
  // command palette. Both skip when the user is typing in a field so
  // they never steal text-editing keystrokes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key !== "n" && key !== "k") return;
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      // ⌘K should still open the palette over the inbox search field —
      // it's the primary launcher for the whole app — so we only guard
      // ⌘N against typing collisions.
      if (key === "n" && typing) return;
      e.preventDefault();
      if (key === "n") openNewMailbox();
      else setPaletteOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openNewMailbox]);

  return (
    <div className="text-foreground flex h-screen overflow-hidden">
      <Sidebar />
      <div className="bg-background flex min-w-0 flex-1 flex-col">
        <TopBar onOpenPalette={() => setPaletteOpen(true)} />
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
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
