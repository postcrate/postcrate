type Props = {
  label: string;
};

export function NavSection({ label }: Props) {
  return (
    <div className="text-muted-foreground/70 px-2.5 pt-1 pb-1.5 text-[10.5px] font-medium tracking-wider uppercase">
      {label}
    </div>
  );
}
