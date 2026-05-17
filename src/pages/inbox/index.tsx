import { TrayIcon } from "@phosphor-icons/react/dist/ssr";

import { PageEmpty } from "@/components/page-empty";

export default function InboxPage() {
  return (
    <PageEmpty
      icon={TrayIcon}
      title="Inbox"
      description="Inspect mail captured by the local SMTP listener."
    />
  );
}
