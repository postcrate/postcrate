import { SWRConfig } from "swr";
import { Outlet } from "react-router-dom";
import { domAnimation, LazyMotion } from "motion/react";

import { fetcher } from "@/lib/fetcher";
import { useTheme } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout() {
  useTheme();

  return (
    <LazyMotion features={domAnimation} strict>
      <SWRConfig value={{ fetcher }}>
        <TooltipProvider delayDuration={200}>
          <Outlet />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </SWRConfig>
    </LazyMotion>
  );
}
