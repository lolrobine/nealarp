import { ThemeToggle } from "@/lib/components/ThemeToggle";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Nealarp</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-20 focus:left-4 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded z-[60]"
      >
        Skip to content
      </a>
      <main id="main-content" className="pt-16">
        {children}
      </main>
    </div>
  );
}
