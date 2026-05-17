import { openPreferencesWindow } from "@/lib/windows";

export function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <h1 className="text-2xl font-semibold">Home</h1>
      <button
        onClick={openPreferencesWindow}
        className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Open Preferences (⌘,)
      </button>
    </main>
  );
}
