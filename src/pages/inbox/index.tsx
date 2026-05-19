import { useViewStore } from "@/stores/use-view-store";

import { InboxLayout } from "./components/inbox-layout";
import { NoMailboxEmpty } from "./components/no-mailbox-empty";

export default function InboxPage() {
  const mailboxId = useViewStore((s) => s.mailboxId);

  if (!mailboxId) return <NoMailboxEmpty />;

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col">
      <InboxLayout mailboxId={mailboxId} />
    </div>
  );
}
