import { TopBar } from "./top-bar";
import { Sidebar } from "./sidebar";
import { ContentArea } from "./content-area";

export function AppShell() {
  return (
    <div className="bg-background text-foreground flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenPalette={() => undefined} />
        <ContentArea />
      </div>
    </div>
  );
}
