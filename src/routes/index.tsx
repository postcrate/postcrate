import { createBrowserRouter, Navigate } from "react-router-dom";

import AuditPage from "@/pages/audit";
import InboxPage from "@/pages/inbox";
import WebhooksPage from "@/pages/webhooks";
import MailboxesPage from "@/pages/mailboxes";
import ScenariosPage from "@/pages/scenarios";
import OnboardingPage from "@/pages/onboarding";
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
          { path: "mailboxes", element: <MailboxesPage /> },
          { path: "scenarios", element: <ScenariosPage /> },
          { path: "webhooks", element: <WebhooksPage /> },
          { path: "audit", element: <AuditPage /> },
        ],
      },
      { path: "preferences", element: <PreferencesPage /> },
      { path: "onboarding", element: <OnboardingPage /> },
    ],
  },
]);
