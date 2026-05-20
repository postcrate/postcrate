/**
 * Per-email rendering inspection.
 *
 * Three hooks: `useRenderPreview(id, profile)` for the client-profile
 * rendered HTML, `useLintReport(id)` for HTML-incompat warnings, and
 * `useA11yReport(id)` for accessibility findings. Profile is part of
 * the cache key so switching client tabs reuses cached previews
 * without re-fetching.
 */

import useSWR, { type SWRConfiguration } from "swr";

import { unwrap } from "@/lib/bridge/ipc";
import {
  commands,
  type A11yReport,
  type Fidelity,
  type LintReport,
  type Profile,
  type RenderedPreview,
} from "@/lib/bridge/bindings";

export type { A11yReport, Fidelity, LintReport, Profile, RenderedPreview };

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export const RENDER_KEYS = {
  preview: (emailId: string, profile: Profile) =>
    ["render", "preview", emailId, profile] as const,
  lint: (emailId: string) => ["render", "lint", emailId] as const,
  a11y: (emailId: string) => ["render", "a11y", emailId] as const,
} as const;

type PreviewKey = ReturnType<typeof RENDER_KEYS.preview>;
type LintKey = ReturnType<typeof RENDER_KEYS.lint>;
type A11yKey = ReturnType<typeof RENDER_KEYS.a11y>;

const READ_ONLY_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

type Result<T> = {
  data: T | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  refresh: () => Promise<T | undefined>;
};

export function useRenderPreview(
  emailId: string | null | undefined,
  profile: Profile,
  config?: SWRConfiguration<RenderedPreview>,
): Result<RenderedPreview> {
  const result = useSWR<RenderedPreview, unknown, PreviewKey | null>(
    emailId ? RENDER_KEYS.preview(emailId, profile) : null,
    async () => unwrap(await commands.renderMessage(emailId as string, profile)),
    { ...READ_ONLY_CONFIG, ...config },
  );
  return {
    data: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

export function useLintReport(
  emailId: string | null | undefined,
  config?: SWRConfiguration<LintReport>,
): Result<LintReport> {
  const result = useSWR<LintReport, unknown, LintKey | null>(
    emailId ? RENDER_KEYS.lint(emailId) : null,
    async () => unwrap(await commands.lintMessage(emailId as string)),
    { ...READ_ONLY_CONFIG, ...config },
  );
  return {
    data: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

export function useA11yReport(
  emailId: string | null | undefined,
  config?: SWRConfiguration<A11yReport>,
): Result<A11yReport> {
  const result = useSWR<A11yReport, unknown, A11yKey | null>(
    emailId ? RENDER_KEYS.a11y(emailId) : null,
    async () => unwrap(await commands.a11yMessage(emailId as string)),
    { ...READ_ONLY_CONFIG, ...config },
  );
  return {
    data: result.data,
    isLoading: result.isLoading,
    isValidating: result.isValidating,
    error: result.error,
    refresh: () => result.mutate(),
  };
}

// ---------------------------------------------------------------------------
// Profile metadata
// ---------------------------------------------------------------------------

/**
 * Display labels for the `Profile` enum so the picker and the iframe
 * header don't have to inline these strings everywhere.
 */
export const PROFILE_LABEL: Record<Profile, string> = {
  gmail_web: "Gmail Web",
  gmail_ios: "Gmail iOS",
  outlook_desktop: "Outlook Desktop",
  outlook_web: "Outlook Web",
  apple_mail_mac: "Apple Mail (macOS)",
  apple_mail_ios: "Apple Mail (iOS)",
  yahoo_mail: "Yahoo Mail",
};

export const PROFILE_ORDER: Profile[] = [
  "gmail_web",
  "gmail_ios",
  "outlook_desktop",
  "outlook_web",
  "apple_mail_mac",
  "apple_mail_ios",
  "yahoo_mail",
];

/**
 * Mirrors `Profile::fidelity()` in the engine. Kept client-side so the
 * picker can label items without round-tripping a render.
 */
export const PROFILE_FIDELITY: Record<Profile, Fidelity> = {
  gmail_web: "approximate",
  gmail_ios: "approximate",
  outlook_desktop: "experimental",
  outlook_web: "approximate",
  apple_mail_mac: "high",
  apple_mail_ios: "high",
  yahoo_mail: "approximate",
};

/**
 * Profiles grouped by client family — the picker uses this to render
 * one section per family with a separator between them.
 */
export const PROFILE_FAMILIES: { label: string; profiles: Profile[] }[] = [
  { label: "Gmail", profiles: ["gmail_web", "gmail_ios"] },
  { label: "Outlook", profiles: ["outlook_desktop", "outlook_web"] },
  { label: "Apple Mail", profiles: ["apple_mail_mac", "apple_mail_ios"] },
  { label: "Yahoo", profiles: ["yahoo_mail"] },
];

export const DEFAULT_PROFILE: Profile = "gmail_web";
