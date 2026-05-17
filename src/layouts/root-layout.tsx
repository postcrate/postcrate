import { Outlet } from "react-router-dom";
import { SWRConfig } from "swr";
import { fetcher } from "../lib/fetcher";

export function RootLayout() {
  return (
    <SWRConfig value={{ fetcher }}>
      <Outlet />
    </SWRConfig>
  );
}
