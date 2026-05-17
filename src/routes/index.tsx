import { createBrowserRouter } from "react-router-dom";

import { Home } from "@/pages/home";
import { RootLayout } from "@/components/layout";
import { Preferences } from "@/pages/preferences";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/preferences", element: <Preferences /> },
    ],
  },
]);
