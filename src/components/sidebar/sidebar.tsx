import { NAV_SECTIONS } from "@/data/nav-items";

import { NavItem } from "./nav-item";
import { NavSection } from "./nav-section";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarStatus } from "./sidebar-status";
import { MailboxSwitcher } from "./mailbox-switcher";

export function Sidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border relative flex w-58 shrink-0 flex-col border-r">
      <SidebarBrand />
      <MailboxSwitcher />
      <nav className="flex-1 space-y-3 overflow-y-auto px-2 pb-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-px">
            <NavSection label={section.label} />
            {section.items.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </nav>
      <SidebarStatus />
    </aside>
  );
}
