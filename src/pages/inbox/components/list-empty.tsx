import { toast } from "sonner";
import { useState } from "react";
import {
  CopyIcon,
  EnvelopeOpenIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { type SyntaxLang } from "@/lib/syntax-highlight";
import { CodeHighlight } from "@/components/code-highlight";
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
 * Shown when the active mailbox has zero captured messages. Displays
 * the SMTP host:port and copy-pasteable snippets for the four runtimes
 * we know users reach for first.
 */
export function ListEmpty({ port }: Props) {
  const [active, setActive] = useState<SnippetKey>("node");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="border-border/60 bg-card/30 flex w-full max-w-md flex-col items-stretch rounded-xl border p-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="bg-muted text-muted-foreground border-border/60 grid size-10 place-items-center rounded-xl border">
            <EnvelopeOpenIcon size={16} weight="regular" />
          </span>
          <h2 className="text-foreground mt-1 text-[14px] font-semibold tracking-tight">
            No messages yet
          </h2>
          <p className="text-muted-foreground max-w-xs text-[12px] leading-snug">
            Send mail to{" "}
            <span className="text-foreground font-mono tabular-nums">
              {HOST}:{port}
            </span>{" "}
            and it will land here in real time.
          </p>
        </div>

        <Tabs
          value={active}
          onValueChange={(v) => setActive(v as SnippetKey)}
          className="mt-5"
        >
          <TabsList variant="line" className="h-auto justify-center gap-1 p-0">
            {ORDER.map((k) => (
              <TabsTrigger
                key={k}
                value={k}
                className="text-[12px]"
              >
                {SNIPPETS[k].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ORDER.map((k) => {
            const s = SNIPPETS[k];
            const code = s.code(port);
            return (
              <TabsContent
                key={k}
                value={k}
                className="border-border/60 bg-background/40 relative mt-3 overflow-hidden rounded-lg border"
              >
                <CodeHighlight code={code} lang={s.lang} />
                <CopyButton code={code} />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}

function CopyButton({ code }: { code: string }) {
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onCopy}
      aria-label="Copy snippet"
      className="absolute top-1.5 right-1.5"
    >
      <CopyIcon size={12} weight="regular" />
    </Button>
  );
}
