import type { Icon } from "@phosphor-icons/react";

import { Kbd } from "@/components/ui/kbd";

type Props = {
  icon: Icon;
  title: string;
  description: string;
};

export function PageEmpty({ icon: IconComp, title, description }: Props) {
  return (
    <div className="bg-background flex flex-1 items-center justify-center overflow-hidden p-10">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="bg-muted text-muted-foreground border-border grid size-12 place-items-center rounded-xl border">
          <IconComp size={20} weight="regular" />
        </div>
        <h2 className="text-foreground mt-4 text-[15px] font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-relaxed">
          {description}
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
