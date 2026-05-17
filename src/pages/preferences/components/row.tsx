import { Label } from "@/components/ui/label";

type Props = {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
};

export function Row({ label, description, htmlFor, children }: Props) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <div className="min-w-0 flex-1">
        <Label htmlFor={htmlFor} className="text-[13px] font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-[12px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}
