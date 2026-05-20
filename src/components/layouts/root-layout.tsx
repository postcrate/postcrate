import { SWRConfig } from "swr";
import { Outlet } from "react-router-dom";
import { domAnimation, LazyMotion } from "motion/react";

import { fetcher } from "@/lib/fetcher";
import { useTheme } from "@/hooks/use-theme";
import { useEmailSync } from "@/services/email";
import { useAuditSync } from "@/services/audit";
import { Toaster } from "@/components/ui/sonner";
import { useMailboxSync } from "@/services/mailbox";
import { useWebhookSync } from "@/services/webhooks";
import { useSettingsSync } from "@/services/settings";
import { useForwardingSync } from "@/services/forwarding";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBounceRuleSync } from "@/services/bounce-rules";
import { useEngineStatusSync } from "@/services/engine-status";

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
 * SWRConfig provider — they need the right cache instance.
 */
function EngineSubscriptions() {
  useMailboxSync();
  useEmailSync();
  useSettingsSync();
  useEngineStatusSync();
  useWebhookSync();
  useForwardingSync();
  useBounceRuleSync();
  useAuditSync();
  return null;
}
