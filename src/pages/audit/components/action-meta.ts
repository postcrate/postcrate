import type { Icon } from "@phosphor-icons/react";

import {
  GearIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";

export type ActionTone = "default" | "destructive" | "warn";

export type ActionMeta = {
  /** Human-readable verb phrase, e.g. "Created mailbox". */
  verb: string;
  /** Glyph for the verb (Plus / Trash / Pencil / Warning / …). */
  Icon: Icon;
  /** Tint the icon when the event is destructive or a failure. */
  tone: ActionTone;
};

/**
 * Map raw `domain.verb` action codes (as the engine writes them) onto
 * a friendly label + icon + tone. New actions fall back to a generic
 * "Verb domain" parse so the table stays readable until we add an
 * explicit entry.
 */
const TABLE: Record<string, ActionMeta> = {
  "mailbox.create": { verb: "Created mailbox", Icon: PlusIcon, tone: "default" },
  "mailbox.update": {
    verb: "Updated mailbox",
    Icon: PencilSimpleIcon,
    tone: "default",
  },
  "mailbox.delete": {
    verb: "Deleted mailbox",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "email.delete": {
    verb: "Deleted email",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "email.note": { verb: "Edited note", Icon: NotePencilIcon, tone: "default" },
  "email.tag": { verb: "Tagged email", Icon: TagIcon, tone: "default" },
  "bounce.create": {
    verb: "Created bounce rule",
    Icon: PlusIcon,
    tone: "default",
  },
  "bounce.update": {
    verb: "Updated bounce rule",
    Icon: PencilSimpleIcon,
    tone: "default",
  },
  "bounce.delete": {
    verb: "Deleted bounce rule",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "webhook.create": {
    verb: "Created webhook",
    Icon: PlusIcon,
    tone: "default",
  },
  "webhook.delete": {
    verb: "Deleted webhook",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "webhook.failed": {
    verb: "Webhook delivery failed",
    Icon: WarningIcon,
    tone: "warn",
  },
  "forwarding.create": {
    verb: "Created forwarding rule",
    Icon: PlusIcon,
    tone: "default",
  },
  "forwarding.delete": {
    verb: "Deleted forwarding rule",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "forwarding.failed": {
    verb: "Forwarding failed",
    Icon: WarningIcon,
    tone: "warn",
  },
  "settings.update": {
    verb: "Updated settings",
    Icon: GearIcon,
    tone: "default",
  },
};

export function actionMeta(action: string): ActionMeta {
  const hit = TABLE[action];
  if (hit) return hit;

  // Fallback: convert `domain.verb` into "Verb domain" with a generic
  // icon. Lets unknown actions still read as English.
  const [domain, rawVerb] = action.split(".");
  const verb = rawVerb ?? action;
  const verbCapitalized = verb.charAt(0).toUpperCase() + verb.slice(1);
  return {
    verb: domain ? `${verbCapitalized} ${domain}` : action,
    Icon: GearIcon,
    tone: action.endsWith(".failed") ? "warn" : "default",
  };
}
