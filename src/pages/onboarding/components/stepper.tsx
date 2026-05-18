import { cn } from "@/lib/utils";

const TOTAL = 3;

type Props = {
  step: 0 | 1 | 2;
};

export function Stepper({ step }: Props) {
  return (
    <ol
      className="mt-1 flex items-center gap-1"
      aria-label={`Step ${step + 1} of ${TOTAL}`}
    >
      {Array.from({ length: TOTAL }).map((_, i) => {
        const isActive = i === step;
        const isDone = i < step;
        return (
          <li
            key={i}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "h-1 rounded-full transition-all duration-200",
              isActive
                ? "bg-brand w-5"
                : isDone
                  ? "bg-foreground/55 w-2.5"
                  : "bg-muted-foreground/25 w-2.5",
            )}
          />
        );
      })}
    </ol>
  );
}
