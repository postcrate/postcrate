import { ThemeToggle } from "@/components/theme-toggle";

export function Preferences() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <header className="mb-8">
        <h1 className="text-xl font-semibold">Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Customize how postcrate looks and behaves.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Appearance</h2>
        <p className="text-xs text-muted-foreground">
          Choose your preferred color scheme.
        </p>
        <div className="pt-2">
          <ThemeToggle />
        </div>
      </section>
    </main>
  );
}
