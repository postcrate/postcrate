import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../components/layout";
import { Home } from "../pages/home";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [{ path: "/", element: <Home /> }],
  },
]);
