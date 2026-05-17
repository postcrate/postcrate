export type MailboxKind = "primary" | "ephemeral" | "shared";

export type Mailbox = {
  id: string;
  projectId: string;
  name: string;
  port: number;
  count: number;
  kind: MailboxKind;
  ttl?: string;
};

export const MAILBOXES: Mailbox[] = [
  {
    id: "default",
    projectId: "personal",
    name: "default",
    port: 1025,
    count: 142,
    kind: "primary",
  },
  {
    id: "staging",
    projectId: "personal",
    name: "staging.io",
    port: 1026,
    count: 38,
    kind: "shared",
  },
  {
    id: "demo-fri",
    projectId: "personal",
    name: "demo-friday",
    port: 1051,
    count: 4,
    kind: "shared",
  },
  {
    id: "pr-482",
    projectId: "acme",
    name: "pr-482",
    port: 1031,
    count: 6,
    kind: "ephemeral",
    ttl: "24h",
  },
  {
    id: "acme-main",
    projectId: "acme",
    name: "acme-main",
    port: 1032,
    count: 71,
    kind: "primary",
  },
  {
    id: "scratch",
    projectId: "side",
    name: "scratch",
    port: 1042,
    count: 21,
    kind: "ephemeral",
    ttl: "1h",
  },
];

export const DEFAULT_MAILBOX_ID = MAILBOXES[0].id;

export function getMailboxesByProject(projectId: string): Mailbox[] {
  return MAILBOXES.filter((m) => m.projectId === projectId);
}

export function getFirstMailboxOfProject(projectId: string): Mailbox {
  return getMailboxesByProject(projectId)[0] ?? MAILBOXES[0];
}
