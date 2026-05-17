import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from "@/stores/use-preferences-store";

import { Row } from "../row";
import { Section } from "../section";

export function NotificationsSection() {
  const n = usePreferencesStore((s) => s.notifications);
  const update = usePreferencesStore((s) => s.update);

  return (
    <Section
      title="Notifications"
      description="How postcrate tells you about incoming mail."
    >
      <Row
        label="System notifications"
        description="Show a native OS notification when an email arrives."
        htmlFor="desktop-new-email"
      >
        <Switch
          id="desktop-new-email"
          checked={n.desktopOnNewEmail}
          onCheckedChange={(v) =>
            update("notifications", { desktopOnNewEmail: v })
          }
        />
      </Row>
      <Row
        label="In-app toast"
        description="Show a transient toast inside postcrate."
        htmlFor="in-app-toast"
      >
        <Switch
          id="in-app-toast"
          checked={n.inAppToast}
          onCheckedChange={(v) => update("notifications", { inAppToast: v })}
        />
      </Row>
      <Row
        label="Sound"
        description="Play a soft chime on each new email."
        htmlFor="sound-new-email"
      >
        <Switch
          id="sound-new-email"
          checked={n.soundOnNewEmail}
          onCheckedChange={(v) =>
            update("notifications", { soundOnNewEmail: v })
          }
        />
      </Row>
      <Row
        label="Dock badge"
        description="Show an unread count badge on the Dock icon."
        htmlFor="badge-unread"
      >
        <Switch
          id="badge-unread"
          checked={n.badgeUnreadCount}
          onCheckedChange={(v) =>
            update("notifications", { badgeUnreadCount: v })
          }
        />
      </Row>
    </Section>
  );
}
