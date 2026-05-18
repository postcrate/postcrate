import { useMemo, useState } from "react";

import { useOnboardingStore } from "@/stores/use-onboarding-store";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";

import { CopyBlock } from "./copy-block";
import { buildSnippets, type SnippetId } from "../snippets";

export function StepSnippets() {
  const draft = useOnboardingStore((s) => s.draft);
  const snippets = useMemo(() => buildSnippets(draft), [draft]);
  const [active, setActive] = useState<SnippetId>(snippets[0].id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs
        value={active}
        onValueChange={(v) => setActive(v as SnippetId)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="h-7 self-start">
          {snippets.map((s) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              className="text-[12px] font-medium"
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {snippets.map((s) => (
          <TabsContent
            key={s.id}
            value={s.id}
            className="mt-2.5 flex min-h-0 flex-col gap-2"
          >
            <p className="text-muted-foreground text-[11.5px] leading-snug">
              {s.hint}
            </p>
            <CopyBlock code={s.body} language={s.language} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
