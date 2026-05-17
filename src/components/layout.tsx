import { SWRConfig } from "swr";
import { Outlet } from "react-router-dom";

import { fetcher } from "@/lib/fetcher";

export function RootLayout() {
  return (
    <SWRConfig value={{ fetcher }}>
      <Outlet />
    </SWRConfig>
  );
}
