import { BellIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";

import { useViewStore } from "@/stores/use-view-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Breadcrumb } from "./breadcrumb";
import { IconButton } from "./icon-button";
import { SearchTrigger } from "./search-trigger";

type Props = {
  onOpenPalette: () => void;
};

export function TopBar({ onOpenPalette }: Props) {
  const view = useViewStore((s) => s.view);

  return (
    <header
      data-tauri-drag-region
      className="bg-sidebar border-sidebar-border flex h-10 shrink-0 items-center gap-1.5 border-b px-3"
    >
      <Breadcrumb view={view} />
      <div className="flex-1" />
      <SearchTrigger onOpen={onOpenPalette} />
      <IconButton icon={BellIcon} title="Notifications" />
      <IconButton icon={ArrowSquareOutIcon} title="Open in browser" />
      <Avatar className="ml-1 size-6">
        <AvatarFallback className="bg-muted text-foreground border-border border text-[10px] font-semibold tracking-wider">
          AC
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
