import { createHighlighter, type Highlighter } from "shiki";

/**
 * Lazily-built shiki highlighter. We boot it once per webview with just
 * the languages we actually render — the full shiki bundle is large,
 * but a constrained init stays light and amortises across snippets.
 */

export const SHIKI_THEMES = {
  light: "github-light-default",
  dark: "github-dark-default",
} as const;

export type SyntaxLang = "ini" | "json" | "ts";

const LANG_MAP: Record<SyntaxLang, string> = {
  ini: "ini",
  json: "json",
  ts: "typescript",
};

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
      langs: Object.values(LANG_MAP),
    });
  }
  return highlighterPromise;
}

export function shikiLangFor(lang: SyntaxLang): string {
  return LANG_MAP[lang];
}
