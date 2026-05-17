import { createBrowserRouter } from "react-router-dom";

import { Home } from "@/pages/home";
import { RootLayout } from "@/components/layout";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [{ path: "/", element: <Home /> }],
  },
]);
