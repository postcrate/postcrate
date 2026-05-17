import { Outlet } from "react-router-dom";

import { TopBar } from "@/components/top-bar";
import { Sidebar } from "@/components/sidebar/sidebar";

export default function MainLayout() {
  return (
    <div className="bg-background text-foreground flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenPalette={() => undefined} />
        <Outlet />
      </div>
    </div>
  );
}
