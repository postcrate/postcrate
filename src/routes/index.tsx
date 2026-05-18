import { createBrowserRouter, Navigate } from "react-router-dom";

import DocsPage from "@/pages/docs";
import AgentPage from "@/pages/agent";
import InboxPage from "@/pages/inbox";
import RenderPage from "@/pages/render";
import MailboxesPage from "@/pages/mailboxes";
import ScenariosPage from "@/pages/scenarios";
import TemplatesPage from "@/pages/templates";
import OnboardingPage from "@/pages/onboarding";
import RecordingsPage from "@/pages/recordings";
import PreferencesPage from "@/pages/preferences";
import RootLayout from "@/components/layouts/root-layout";
import MainLayout from "@/components/layouts/main-layout";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/inbox" replace /> },
          { path: "inbox", element: <InboxPage /> },
          { path: "agent", element: <AgentPage /> },
          { path: "render", element: <RenderPage /> },
          { path: "mailboxes", element: <MailboxesPage /> },
          { path: "scenarios", element: <ScenariosPage /> },
          { path: "recordings", element: <RecordingsPage /> },
          { path: "templates", element: <TemplatesPage /> },
          { path: "docs", element: <DocsPage /> },
        ],
      },
      { path: "preferences", element: <PreferencesPage /> },
      { path: "onboarding", element: <OnboardingPage /> },
    ],
  },
]);
