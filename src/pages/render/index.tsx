import { BrowsersIcon } from "@phosphor-icons/react/dist/ssr";

import { PageEmpty } from "@/components/page-empty";

export default function RenderPage() {
  return (
    <PageEmpty
      icon={BrowsersIcon}
      title="Render preview"
      description="Preview emails across clients, modes and viewport sizes."
    />
  );
}
