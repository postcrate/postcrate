import { PackageIcon } from "@phosphor-icons/react/dist/ssr";

import { PageEmpty } from "@/components/page-empty";

export default function MailboxesPage() {
  return (
    <PageEmpty
      icon={PackageIcon}
      title="Mailboxes"
      description="Manage primary, shared and ephemeral mailboxes."
    />
  );
}
