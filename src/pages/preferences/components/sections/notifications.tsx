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
        description="Show a native OS notification for mail in mailboxes you aren't currently viewing."
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
        description="Show a transient toast for new mail in mailboxes you aren't currently viewing."
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
        description="Play a soft chime when mail arrives in a mailbox you aren't currently viewing."
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
        description="Show a count of new emails received while you were outside the inbox. Resets when you return."
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
