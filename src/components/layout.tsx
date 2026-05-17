import { SWRConfig } from "swr";
import { Outlet } from "react-router-dom";

import { fetcher } from "@/lib/fetcher";
import { useTheme } from "@/hooks/use-theme";

export function RootLayout() {
  useTheme();

  return (
    <SWRConfig value={{ fetcher }}>
      <Outlet />
    </SWRConfig>
  );
}
