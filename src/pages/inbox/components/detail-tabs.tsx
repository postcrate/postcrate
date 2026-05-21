import { useState } from "react";

import { type EmailDetail } from "@/services/email";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DetailRaw } from "./detail-raw";
import { DetailText } from "./detail-text";
import { DetailRender } from "./detail-render";
import { DetailHeaders } from "./detail-headers";
import { DetailPreview } from "./detail-preview";
import { DetailInspect } from "./detail-inspect";
import { DetailTranscript } from "./detail-transcript";
import { PreviewThemeToggle } from "./preview-theme-toggle";

type Props = {
  email: EmailDetail;
};

type TabValue =
  | "preview"
  | "text"
  | "headers"
  | "raw"
  | "inspect"
  | "render"
  | "transcript";

/**
 * Body-view switcher. Defaults to Preview if HTML is present, falls
 * back to Text. Raw / Inspect / Render fetch their data lazily on tab
 * activation; the cheap views (Preview / Text / Headers) render off
 * the detail payload we already have.
 */
export function DetailTabs({ email }: Props) {
  const initial: TabValue = email.hasHtml ? "preview" : "text";
  const [value, setValue] = useState<TabValue>(initial);

  return (
    <Tabs
      value={value}
      onValueChange={(v) => setValue(v as TabValue)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="border-border/60 flex shrink-0 items-center justify-between gap-2 border-b px-6">
        <TabsList
          variant="line"
          className="h-auto justify-start gap-1 p-0"
        >
          <Trigger value="preview" disabled={!email.hasHtml}>
            Preview
          </Trigger>
          <Trigger value="text" disabled={!email.hasText && !email.textBody}>
            Text
          </Trigger>
          <Trigger value="headers">Headers</Trigger>
          <Trigger value="raw">Raw</Trigger>
          <Trigger value="inspect">Inspect</Trigger>
          <Trigger value="render" disabled={!email.hasHtml}>
            Render
          </Trigger>
          <Trigger value="transcript">Transcript</Trigger>
        </TabsList>
        {value === "preview" || value === "render" ? (
          <PreviewThemeToggle />
        ) : null}
      </div>

      <TabsContent
        value="preview"
        className="min-h-0 flex-1 overflow-hidden focus-visible:outline-none"
      >
        {email.htmlBody ? (
          <DetailPreview html={email.htmlBody} />
        ) : (
          <EmptyTab message="This message has no HTML body." />
        )}
      </TabsContent>

      <TabsContent
        value="text"
        className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        {email.textBody ? (
          <DetailText text={email.textBody} />
        ) : (
          <EmptyTab message="This message has no plain-text body." />
        )}
      </TabsContent>

      <TabsContent
        value="headers"
        className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <DetailHeaders
          headers={email.headers}
          messageId={email.messageId}
          inReplyTo={email.inReplyTo}
        />
      </TabsContent>

      <TabsContent
        value="raw"
        className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <DetailRaw emailId={email.id} />
      </TabsContent>

      <TabsContent
        value="inspect"
        className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <DetailInspect emailId={email.id} />
      </TabsContent>

      <TabsContent
        value="render"
        className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <DetailRender emailId={email.id} hasHtml={email.hasHtml} />
      </TabsContent>

      <TabsContent
        value="transcript"
        className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <DetailTranscript emailId={email.id} />
      </TabsContent>
    </Tabs>
  );
}

function Trigger({
  value,
  disabled,
  children,
}: {
  value: TabValue;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      disabled={disabled}
      className="text-[12.5px]"
    >
      {children}
    </TabsTrigger>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground px-6 py-10 text-center text-[12.5px]">
      {message}
    </p>
  );
}
