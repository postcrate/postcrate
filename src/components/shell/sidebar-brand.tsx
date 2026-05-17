import { cn } from "@/lib/utils";
import { useFullscreen } from "@/hooks/use-fullscreen";

import { ProjectSwitcher } from "./project-switcher";

export function SidebarBrand() {
  const fullscreen = useFullscreen();

  return (
    <div
      data-tauri-drag-region
      className={cn(
        "flex h-8 shrink-0 items-center gap-2 pr-2",
        fullscreen ? "justify-start pl-2" : "justify-end pl-20",
      )}
    >
      <ProjectSwitcher />
    </div>
  );
}
