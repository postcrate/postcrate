type Props = {
  title: string;
  subtitle?: string;
};

export function Breadcrumb({ title, subtitle }: Props) {
  return (
    <div className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
      <span className="text-foreground text-[13px] font-medium tracking-tight">
        {title}
      </span>
      {subtitle ? (
        <span className="text-muted-foreground/70 truncate text-[11.5px] tabular-nums">
          {subtitle}
        </span>
      ) : null}
    </div>
  );
}
