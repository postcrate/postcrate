import type { OnboardingDraft } from "@/stores/use-onboarding-store";

export type SnippetId = "env" | "mcp" | "nodemailer";

export type Snippet = {
  id: SnippetId;
  label: string;
  language: "ini" | "json" | "ts";
  body: string;
  hint: string;
};

export function buildSnippets(draft: OnboardingDraft): Snippet[] {
  const { smtpPort, mailboxName } = draft;
  return [
    {
      id: "env",
      label: ".env",
      language: "ini",
      hint: "Drop into the app you're testing. Most SMTP libraries pick these up automatically.",
      body: [
        `SMTP_HOST=127.0.0.1`,
        `SMTP_PORT=${smtpPort}`,
        `SMTP_USER=`,
        `SMTP_PASS=`,
        `SMTP_FROM="postcrate <dev@${mailboxName}.local>"`,
      ].join("\n"),
    },
    {
      id: "mcp",
      label: "MCP config",
      language: "json",
      hint: "Add to Claude Desktop or any MCP-compatible client to give agents inbox access.",
      body: JSON.stringify(
        {
          mcpServers: {
            postcrate: {
              command: "postcrate",
              args: ["mcp"],
              env: {
                POSTCRATE_HTTP: `http://127.0.0.1:${smtpPort + 55}`,
                POSTCRATE_MAILBOX: mailboxName,
              },
            },
          },
        },
        null,
        2,
      ),
    },
    {
      id: "nodemailer",
      label: "Nodemailer",
      language: "ts",
      hint: "Run this once to confirm captures are landing in the inbox.",
      body: [
        `import nodemailer from "nodemailer";`,
        ``,
        `const transport = nodemailer.createTransport({`,
        `  host: "127.0.0.1",`,
        `  port: ${smtpPort},`,
        `  secure: false,`,
        `});`,
        ``,
        `await transport.sendMail({`,
        `  from: "dev@${mailboxName}.local",`,
        `  to: "you@example.com",`,
        `  subject: "Hello from postcrate",`,
        `  text: "If you see this in the inbox, you're wired up.",`,
        `});`,
      ].join("\n"),
    },
  ];
}
