import { toast } from "sonner";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { CopyBlock } from "@/components/copy-block";
import { type SyntaxLang } from "@/lib/syntax-highlight";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  port: number;
};

const HOST = "127.0.0.1";

type SnippetKey = "node" | "python" | "go" | "swaks";

type Snippet = {
  label: string;
  lang: SyntaxLang;
  code: (port: number) => string;
};

const SNIPPETS: Record<SnippetKey, Snippet> = {
  node: {
    label: "Node",
    lang: "ts",
    code: (port) => `import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: "${HOST}",
  port: ${port},
  secure: false,
});

await transport.sendMail({
  from: "app@example.com",
  to: "you@example.com",
  subject: "Hello from Node",
  text: "First captured message.",
});`,
  },
  python: {
    label: "Python",
    lang: "python",
    code: (port) => `import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg["From"] = "app@example.com"
msg["To"] = "you@example.com"
msg["Subject"] = "Hello from Python"
msg.set_content("First captured message.")

with smtplib.SMTP("${HOST}", ${port}) as smtp:
    smtp.send_message(msg)`,
  },
  go: {
    label: "Go",
    lang: "go",
    code: (port) => `package main

import "net/smtp"

func main() {
  msg := []byte("From: app@example.com\\r\\n" +
    "To: you@example.com\\r\\n" +
    "Subject: Hello from Go\\r\\n" +
    "\\r\\n" +
    "First captured message.\\r\\n")
  err := smtp.SendMail("${HOST}:${port}", nil,
    "app@example.com", []string{"you@example.com"}, msg)
  if err != nil {
    panic(err)
  }
}`,
  },
  swaks: {
    label: "swaks",
    lang: "shell",
    code: (port) =>
      `swaks --to you@example.com \\
  --from app@example.com \\
  --server ${HOST}:${port} \\
  --body "First captured message."`,
  },
};

const ORDER: SnippetKey[] = ["node", "python", "go", "swaks"];

/**
 * Shown when the active mailbox has zero captured messages. Quietly
 * surfaces the SMTP endpoint as a copyable pill and language tabs
 * underneath, with no outer card chrome — the surface stays flat so it
 * reads as a hint rather than an alert.
 */
export function ListEmpty({ port }: Props) {
  const [active, setActive] = useState<SnippetKey>("node");

  return (
    <div className="flex flex-1 items-center justify-center px-8 py-12">
      <div className="flex w-full max-w-md flex-col">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-foreground text-[14.5px] font-medium tracking-tight">
            Waiting for your first message
          </h2>
          <p className="text-muted-foreground mt-1.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[12.5px] leading-snug">
            <span>Send mail to</span>
            <EndpointPill host={HOST} port={port} />
            <span>and it shows up here.</span>
          </p>
        </div>

        <Tabs
          value={active}
          onValueChange={(v) => setActive(v as SnippetKey)}
          className="mt-7 flex min-h-0 flex-col"
        >
          <TabsList className="h-7 self-center">
            {ORDER.map((k) => (
              <TabsTrigger
                key={k}
                value={k}
                className="text-[12px] font-medium"
              >
                {SNIPPETS[k].label}
              </TabsTrigger>
            ))}
          </TabsList>
          {ORDER.map((k) => {
            const s = SNIPPETS[k];
            return (
              <TabsContent key={k} value={k} className="mt-3">
                <CopyBlock code={s.code(port)} language={s.lang} />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}

function EndpointPill({ host, port }: { host: string; port: number }) {
  const value = `${host}:${port}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${value}`}
      className={cn(
        "border-border/50 bg-muted/50 text-foreground hover:bg-muted hover:border-border/80",
        "inline-flex h-5 items-center gap-1 rounded-md border px-1.5",
        "font-mono text-[11.5px] tabular-nums transition-colors",
      )}
    >
      <span>{value}</span>
      {copied ? (
        <CheckIcon size={10} weight="bold" className="text-success" />
      ) : (
        <CopyIcon
          size={10}
          weight="regular"
          className="text-muted-foreground/70"
        />
      )}
    </button>
  );
}
