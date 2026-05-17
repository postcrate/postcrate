import { VIEW_TITLES, type ViewId } from "@/data/nav-items";

type Props = {
  view: ViewId;
};

export function Breadcrumb({ view }: Props) {
  return (
    <span className="text-foreground text-[13px] font-medium tracking-tight whitespace-nowrap">
      {VIEW_TITLES[view]}
    </span>
  );
}
