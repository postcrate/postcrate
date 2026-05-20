import type { Icon } from "@phosphor-icons/react";

type Props = {
  icon: Icon;
  title: string;
  description: string;
  action?: React.ReactNode;
};

/**
 * Page header for top-level destinations (Webhooks, Audit, …). Mirrors
 * the Mailboxes page header in spacing and typography so every page in
 * the sidebar looks built from the same kit.
 */
export function PageHeader({
  icon: IconComp,
  title,
  description,
  action,
}: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="bg-muted text-muted-foreground border-border/60 grid size-9 place-items-center rounded-lg border">
          <IconComp size={16} weight="regular" />
        </span>
        <div className="min-w-0">
          <h1 className="text-foreground text-[17px] leading-none font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1 text-[12px] leading-snug">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </header>
  );
}
