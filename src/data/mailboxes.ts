export type MailboxKind = "primary" | "ephemeral" | "shared";

export type Mailbox = {
  id: string;
  name: string;
  port: number;
  count: number;
  kind: MailboxKind;
  ttl?: string;
};

export const MAILBOXES: Mailbox[] = [
  { id: "default", name: "default", port: 1025, count: 142, kind: "primary" },
  { id: "staging", name: "staging.io", port: 1026, count: 38, kind: "shared" },
  { id: "pr-482", name: "pr-482", port: 1031, count: 6, kind: "ephemeral", ttl: "24h" },
  { id: "scratch", name: "scratch", port: 1042, count: 21, kind: "ephemeral", ttl: "1h" },
  { id: "demo-fri", name: "demo-friday", port: 1051, count: 4, kind: "shared" },
];

export const DEFAULT_MAILBOX_ID = MAILBOXES[0].id;
