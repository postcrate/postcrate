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
  "mailbox.create": { verb: "Mailbox created", Icon: PlusIcon, tone: "default" },
  "mailbox.update": {
    verb: "Mailbox updated",
    Icon: PencilSimpleIcon,
    tone: "default",
  },
  "mailbox.delete": {
    verb: "Mailbox deleted",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "email.delete": {
    verb: "Email deleted",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "email.note": { verb: "Note edited", Icon: NotePencilIcon, tone: "default" },
  "email.tag": { verb: "Email tagged", Icon: TagIcon, tone: "default" },
  "bounce.create": {
    verb: "Bounce rule added",
    Icon: PlusIcon,
    tone: "default",
  },
  "bounce.update": {
    verb: "Bounce rule updated",
    Icon: PencilSimpleIcon,
    tone: "default",
  },
  "bounce.delete": {
    verb: "Bounce rule deleted",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "webhook.create": {
    verb: "Webhook added",
    Icon: PlusIcon,
    tone: "default",
  },
  "webhook.delete": {
    verb: "Webhook deleted",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "webhook.failed": {
    verb: "Webhook delivery failed",
    Icon: WarningIcon,
    tone: "warn",
  },
  "forwarding.create": {
    verb: "Forwarding rule added",
    Icon: PlusIcon,
    tone: "default",
  },
  "forwarding.delete": {
    verb: "Forwarding rule deleted",
    Icon: TrashIcon,
    tone: "destructive",
  },
  "forwarding.failed": {
    verb: "Forwarding failed",
    Icon: WarningIcon,
    tone: "warn",
  },
  "settings.update": {
    verb: "Settings updated",
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
