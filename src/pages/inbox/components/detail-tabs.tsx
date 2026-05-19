import { useState } from "react";

import { type EmailDetail } from "@/services/email";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DetailRaw } from "./detail-raw";
import { DetailText } from "./detail-text";
import { DetailHeaders } from "./detail-headers";
import { DetailPreview } from "./detail-preview";

type Props = {
  email: EmailDetail;
};

type TabValue = "preview" | "text" | "headers" | "raw";

/**
 * Body-view switcher. Defaults to Preview if HTML is present, falls
 * back to Text. Raw fetches its bytes lazily; the others render off
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
      <div className="border-border/60 shrink-0 border-b px-6">
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
        </TabsList>
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
        <DetailHeaders headers={email.headers} />
      </TabsContent>

      <TabsContent
        value="raw"
        className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <DetailRaw emailId={email.id} />
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
