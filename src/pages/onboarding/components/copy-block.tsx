import { toast } from "sonner";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { type SyntaxLang } from "@/lib/syntax-highlight";
import { CodeHighlight } from "@/components/code-highlight";

type Props = {
  code: string;
  language: SyntaxLang;
};

const LANGUAGE_LABEL: Record<SyntaxLang, string> = {
  ini: "env",
  json: "json",
  ts: "ts",
  python: "py",
  go: "go",
  shell: "sh",
};

export function CopyBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }

  return (
    <div className="border-border/60 bg-muted/40 group relative overflow-hidden rounded-lg border">
      <div className="text-muted-foreground/80 border-border/40 bg-muted/30 flex h-7 items-center justify-between border-b pr-1.5 pl-2.5 text-[10px] tracking-wider uppercase">
        <span className="font-mono">{LANGUAGE_LABEL[language]}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy snippet"
          className={cn(
            "text-muted-foreground hover:text-foreground inline-flex h-5 items-center gap-1 rounded px-1.5",
            "text-[10.5px] font-medium tracking-normal normal-case transition-colors",
          )}
        >
          {copied ? (
            <>
              <CheckIcon size={10} weight="bold" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon size={10} weight="bold" />
              Copy
            </>
          )}
        </button>
      </div>
      <CodeHighlight code={code} lang={language} />
    </div>
  );
}
