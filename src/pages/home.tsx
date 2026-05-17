import { openPreferencesWindow } from "@/lib/windows";

export function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div
        data-tauri-drag-region
        className="sticky top-0 z-10 h-10 shrink-0"
      />
      <main className="-mt-10 flex flex-1 flex-col items-center justify-center gap-6 pt-10">
        <h1 className="text-2xl font-semibold">Home</h1>
        <button
          onClick={openPreferencesWindow}
          className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Open Preferences (⌘,)
        </button>
      </main>
    </div>
  );
}
