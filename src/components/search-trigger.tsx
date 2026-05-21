import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";

import { Kbd } from "@/components/ui/kbd";

type Props = {
  onOpen: () => void;
};

export function SearchTrigger({ onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-background border-input text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/30 flex h-7 min-w-64 items-center gap-2 rounded-md border px-2 text-[12px] transition-colors outline-none focus-visible:ring-2"
    >
      <MagnifyingGlassIcon size={12} weight="regular" />
      <span>Search or jump to…</span>
      <Kbd className="ml-auto h-4 bg-transparent text-[10px]">⌘K</Kbd>
    </button>
  );
}
