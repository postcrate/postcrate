import { RecordIcon } from "@phosphor-icons/react/dist/ssr";

import { PageEmpty } from "@/components/page-empty";

export default function RecordingsPage() {
  return (
    <PageEmpty
      icon={RecordIcon}
      title="Recordings"
      description="Capture and replay deterministic mail traffic."
    />
  );
}
