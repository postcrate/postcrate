import { m } from "motion/react";
import { Outlet, useLocation } from "react-router-dom";

import { TopBar } from "@/components/top-bar";
import { Sidebar } from "@/components/sidebar/sidebar";

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="text-foreground flex h-screen overflow-hidden">
      <Sidebar />
      <div className="bg-background flex min-w-0 flex-1 flex-col">
        <TopBar onOpenPalette={() => undefined} />
        <m.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <Outlet />
        </m.div>
      </div>
    </div>
  );
}
