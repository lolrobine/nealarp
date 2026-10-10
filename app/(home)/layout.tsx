import { ThemeToggle } from "@/lib/components/ThemeToggle";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">neal.fun</h1>
            <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded">
              v2
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="pt-16">{children}</main>
    </div>
  );
}
