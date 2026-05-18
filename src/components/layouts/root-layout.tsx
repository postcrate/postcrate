import { SWRConfig } from "swr";
import { Outlet } from "react-router-dom";
import { domAnimation, LazyMotion } from "motion/react";

import { fetcher } from "@/lib/fetcher";
import { useTheme } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/sonner";
import { useMailboxSync } from "@/services/mailbox";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout() {
  useTheme();

  return (
    <LazyMotion features={domAnimation} strict>
      <SWRConfig value={{ fetcher }}>
        <TooltipProvider delayDuration={200}>
          <EngineSubscriptions />
          <Outlet />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </SWRConfig>
    </LazyMotion>
  );
}

/**
 * A render-less child so the engine-event hooks live *inside* the
 * SWRConfig provider — `useMailboxSync` needs the right cache instance.
 */
function EngineSubscriptions() {
  useMailboxSync();
  return null;
}
