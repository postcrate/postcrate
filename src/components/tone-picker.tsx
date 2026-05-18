import { CheckIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import {
  PROJECT_TONE_BG,
  PROJECT_TONES,
  type ProjectTone,
} from "@/stores/use-projects-store";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TONE_LABEL: Record<ProjectTone, string> = {
  brand: "Iris",
  info: "Sky",
  success: "Mint",
  warn: "Amber",
  danger: "Coral",
};

type Props = {
  value: ProjectTone;
  onChange: (tone: ProjectTone) => void;
};

/**
 * Color-swatch picker. The trigger is a small rounded-square swatch so
 * it nests cleanly inside an InputGroup as a leading addon. Selection
 * happens in a dropdown with full tone names.
 */
export function TonePicker({ value, onChange }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Project color: ${TONE_LABEL[value]}`}
        className={cn(
          "group/swatch grid size-[14px] shrink-0 cursor-pointer place-items-center rounded-[4px] outline-none",
          "ring-offset-background transition-shadow",
          "focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:ring-offset-1",
          "data-[state=open]:ring-foreground/25 data-[state=open]:ring-2 data-[state=open]:ring-offset-1",
          PROJECT_TONE_BG[value],
        )}
      >
        <span className="sr-only">Pick project color</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="min-w-40 p-1"
      >
        <DropdownMenuLabel className="text-muted-foreground/70 px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider uppercase">
          Project color
        </DropdownMenuLabel>
        {PROJECT_TONES.map((tone) => {
          const selected = tone === value;
          return (
            <DropdownMenuItem
              key={tone}
              onSelect={() => onChange(tone)}
              className="h-7 gap-2.5 px-2"
            >
              <span
                aria-hidden
                className={cn(
                  "size-3 shrink-0 rounded-[3px]",
                  PROJECT_TONE_BG[tone],
                )}
              />
              <span className="text-foreground flex-1 truncate text-[12.5px]">
                {TONE_LABEL[tone]}
              </span>
              {selected ? (
                <CheckIcon
                  size={11}
                  weight="bold"
                  className="text-foreground/80 shrink-0"
                />
              ) : (
                <span className="size-[11px] shrink-0" aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
