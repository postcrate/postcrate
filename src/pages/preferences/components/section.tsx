type HeaderProps = {
  title: string;
  description: string;
};

function SectionHeader({ title, description }: HeaderProps) {
  return (
    <header className="mb-3">
      <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-0.5 text-[12.5px] leading-snug">
        {description}
      </p>
    </header>
  );
}

type SectionProps = HeaderProps & {
  children: React.ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <>
      <SectionHeader title={title} description={description} />
      <div className="divide-border/60 divide-y">{children}</div>
    </>
  );
}
