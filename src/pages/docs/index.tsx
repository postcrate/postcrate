import { BookOpenIcon } from "@phosphor-icons/react/dist/ssr";

import { PageEmpty } from "@/components/page-empty";

export default function DocsPage() {
  return (
    <PageEmpty
      icon={BookOpenIcon}
      title="Docs"
      description="API reference, recipes and integration guides."
    />
  );
}
