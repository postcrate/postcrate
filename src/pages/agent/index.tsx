import { RobotIcon } from "@phosphor-icons/react/dist/ssr";

import { PageEmpty } from "@/components/page-empty";

export default function AgentPage() {
  return (
    <PageEmpty
      icon={RobotIcon}
      title="AI Agent"
      description="Connect AI agents to send and validate mail end-to-end."
    />
  );
}
