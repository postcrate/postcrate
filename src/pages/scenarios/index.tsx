import { FlaskIcon } from "@phosphor-icons/react/dist/ssr";

import { PageEmpty } from "@/components/page-empty";

export default function ScenariosPage() {
  return (
    <PageEmpty
      icon={FlaskIcon}
      title="Scenarios"
      description="Replay recorded mail flows against expected matchers."
    />
  );
}
