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
      description="How Postcrate tells you about new mail."
    >
      <Row
        label="System notifications"
        description="Post a native notification for mail in mailboxes you're not viewing."
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
        description="Show a brief toast for new mail in mailboxes you're not viewing."
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
        description="Play a soft chime when mail arrives in another mailbox."
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
        description="Count new mail received while you were away. Resets when you return."
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
