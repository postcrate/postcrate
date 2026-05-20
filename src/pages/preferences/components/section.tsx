type HeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

function SectionHeader({ title, description, action }: HeaderProps) {
  return (
    <header className="mb-3 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-0.5 text-[12.5px] leading-snug">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

type SectionProps = HeaderProps & {
  children: React.ReactNode;
  /**
   * Render the body without the default `divide-y` rule between rows.
   * Sections that group their content in cards, accordions, or empty
   * states need the bare container.
   */
  bare?: boolean;
};

export function Section({
  title,
  description,
  action,
  children,
  bare = false,
}: SectionProps) {
  return (
    <>
      <SectionHeader title={title} description={description} action={action} />
      <div className={bare ? "" : "divide-border/60 divide-y"}>{children}</div>
    </>
  );
}
