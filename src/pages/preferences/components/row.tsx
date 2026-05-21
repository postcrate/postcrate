import { Label } from "@/components/ui/label";

type Props = {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  /**
   * Mark this row as a placeholder UI control with no engine wiring
   * yet. Renders a small "Soon" pill inline with the label so users
   * know toggling it is purely cosmetic.
   */
  comingSoon?: boolean;
};

export function Row({
  label,
  description,
  htmlFor,
  children,
  comingSoon,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={htmlFor} className="text-[13px] font-medium">
            {label}
          </Label>
          {comingSoon ? <SoonPill /> : null}
        </div>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-[12px] leading-snug">
            {description}
          </p>
        )}
      </div>
      <div className="flex h-8 shrink-0 items-center">{children}</div>
    </div>
  );
}

function SoonPill() {
  return (
    <span
      title="Coming soon"
      className="bg-muted/70 text-muted-foreground/90 inline-flex h-[14px] items-center rounded-full px-1.5 text-[9px] font-semibold tracking-wider uppercase"
    >
      Soon
    </span>
  );
}
