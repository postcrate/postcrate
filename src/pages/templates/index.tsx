import { FilesIcon } from "@phosphor-icons/react/dist/ssr";

import { PageEmpty } from "@/components/page-empty";

export default function TemplatesPage() {
  return (
    <PageEmpty
      icon={FilesIcon}
      title="Templates"
      description="Reusable snippets for fixtures and seed data."
    />
  );
}
