import { toast } from "sonner";
import { BellIcon } from "@phosphor-icons/react/dist/ssr";

import { MAILBOXES } from "@/data/mailboxes";
import { useViewStore } from "@/stores/use-view-store";
import { VIEW_SUBTITLES, VIEW_TITLES } from "@/data/nav-items";

import { Breadcrumb } from "./breadcrumb";
import { IconButton } from "./icon-button";
import { SearchTrigger } from "./search-trigger";

type Props = {
  onOpenPalette: () => void;
};

export function TopBar({ onOpenPalette }: Props) {
  const view = useViewStore((s) => s.view);
  const mailboxId = useViewStore((s) => s.mailboxId);

  const subtitle =
    view === "inbox"
      ? `${MAILBOXES.find((m) => m.id === mailboxId)?.count ?? 0} messages`
      : VIEW_SUBTITLES[view];

  return (
    <header
      data-tauri-drag-region
      className="bg-sidebar border-sidebar-border flex h-10 shrink-0 items-center gap-2 border-b pr-2 pl-3"
    >
      <Breadcrumb title={VIEW_TITLES[view]} subtitle={subtitle} />
      <div className="flex-1" />
      <SearchTrigger onOpen={onOpenPalette} />
      <IconButton
        icon={BellIcon}
        title="Notifications"
        onClick={() => toast("You're all caught up")}
      />
    </header>
  );
}
