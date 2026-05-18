import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import {
  SHIKI_THEMES,
  getHighlighter,
  shikiLangFor,
  type SyntaxLang,
} from "@/lib/syntax-highlight";

type Props = {
  code: string;
  lang: SyntaxLang;
  className?: string;
};

/**
 * Syntax-highlighted code block via shiki. Picks up dark/light from the
 * active app theme so it stays consistent with the rest of the UI. We
 * neutralise shiki's own `<pre>` background+padding via a `transformer`
 * so the surrounding container's styling owns the look.
 */
export function CodeHighlight({ code, lang, className }: Props) {
  const { resolved } = useTheme();
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return;
        const rendered = highlighter.codeToHtml(code, {
          lang: shikiLangFor(lang),
          theme: resolved === "dark" ? SHIKI_THEMES.dark : SHIKI_THEMES.light,
          transformers: [
            {
              pre(node) {
                node.properties["data-highlighted"] = "true";
                // Drop shiki's inline background so our container styles win.
                const style = node.properties.style;
                if (typeof style === "string") {
                  node.properties.style = style
                    .split(";")
                    .map((s) => s.trim())
                    .filter((s) => s && !s.startsWith("background-color"))
                    .join("; ");
                }
              },
            },
          ],
        });
        setHtml(rendered);
      })
      .catch((err) => {
        console.error("shiki highlight failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang, resolved]);

  if (!html) {
    return (
      <pre
        className={cn(
          "text-foreground/90 overflow-auto px-3 py-2.5 font-mono text-[11.5px] leading-relaxed",
          className,
        )}
      >
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "[&_pre]:overflow-auto [&_pre]:px-3 [&_pre]:py-2.5 [&_pre]:font-mono [&_pre]:text-[11.5px] [&_pre]:leading-relaxed",
        "[&_code]:font-mono",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
