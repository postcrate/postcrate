import type { Icon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  icon: Icon;
  title: string;
  size?: "sm" | "md";
  onClick?: () => void;
};

const SIZES = {
  sm: { btn: "size-6", icon: 13 },
  md: { btn: "size-7", icon: 14 },
} as const;

export function IconButton({ icon: IconComp, title, size = "md", onClick }: Props) {
  const sz = SIZES[size];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={title}
          onClick={onClick}
          className={cn(
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            "inline-flex items-center justify-center rounded-md transition-colors",
            "focus-visible:ring-ring/30 outline-none focus-visible:ring-2",
            sz.btn,
          )}
        >
          <IconComp size={sz.icon} weight="regular" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}
