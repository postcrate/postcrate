import type { Layout } from "react-resizable-panels";

import { useCallback, useMemo } from "react";

import { useEmails } from "@/services/email";
import { useMailbox } from "@/services/mailbox";
import { useViewStore } from "@/stores/use-view-store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { ListEmpty } from "./list-empty";
import { ListPanel } from "./list-panel";
import { ChaosBanner } from "./chaos-banner";
import { DetailPanel } from "./detail-panel";

type Props = {
  mailboxId: string;
};

const LAYOUT_STORAGE_KEY = "postcrate.inbox.split.v3";

/**
 * Inbox shell. The list pane has a pixel-stable width that the user
 * can drag (min 280px, max 520px); the detail pane absorbs whatever's
 * left and reflows when the window resizes. When the active mailbox
 * has zero captured messages we replace both panes with the framework
 * snippets CTA centered across the full content area.
 */
export function InboxLayout({ mailboxId }: Props) {
  const emailId = useViewStore((s) => s.emailId);
  const { mailbox } = useMailbox(mailboxId);
  const { emails, isLoading, error } = useEmails(mailboxId);
  const mailboxIsEmpty =
    !isLoading && !error && (emails?.length ?? 0) === 0;

  const { defaultLayout, onLayoutChanged } = useLayoutStorage(
    LAYOUT_STORAGE_KEY,
  );

  if (mailboxIsEmpty && mailbox) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <ChaosBanner mailboxId={mailboxId} />
        <div className="flex flex-1 items-center justify-center">
          <ListEmpty port={mailbox.port} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ChaosBanner mailboxId={mailboxId} />
      <ResizablePanelGroup
        id="postcrate-inbox-split"
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          id="list"
          defaultSize="360px"
          minSize="280px"
          maxSize="520px"
          groupResizeBehavior="preserve-pixel-size"
          className="flex min-w-0 flex-col"
        >
          <ListPanel mailboxId={mailboxId} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          id="detail"
          groupResizeBehavior="preserve-relative-size"
          className="flex min-w-0 flex-col"
        >
          <DetailPanel emailId={emailId} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function useLayoutStorage(key: string): {
  defaultLayout: Layout | undefined;
  onLayoutChanged: (layout: Layout) => void;
} {
  const defaultLayout = useMemo<Layout | undefined>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") return parsed as Layout;
    } catch {
      // Stale or unparseable — discard and start fresh.
    }
    return undefined;
  }, [key]);

  const onLayoutChanged = useCallback(
    (layout: Layout) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(layout));
      } catch {
        // Storage quota or disabled — ignore.
      }
    },
    [key],
  );

  return { defaultLayout, onLayoutChanged };
}
