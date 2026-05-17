import { Kbd } from "@/components/ui/kbd";
import { useViewStore } from "@/stores/use-view-store";
import { VIEW_TITLES, VIEW_DESCRIPTIONS, getViewIcon } from "@/data/nav-items";

export function ContentArea() {
  const view = useViewStore((s) => s.view);
  const IconComp = getViewIcon(view);

  return (
    <div className="bg-background flex flex-1 items-center justify-center overflow-hidden p-10">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="bg-muted text-muted-foreground border-border grid size-12 place-items-center rounded-xl border">
          <IconComp size={20} weight="regular" />
        </div>
        <h2 className="text-foreground mt-4 text-[15px] font-semibold tracking-tight">
          {VIEW_TITLES[view]}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-relaxed">
          {VIEW_DESCRIPTIONS[view]}
        </p>
        <div className="text-muted-foreground/70 mt-6 flex items-center gap-1.5 text-[11.5px]">
          <span>Press</span>
          <Kbd className="h-4 text-[10px]">⌘K</Kbd>
          <span>to jump anywhere</span>
        </div>
      </div>
    </div>
  );
}
