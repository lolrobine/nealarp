import Link from "next/link";
import { ThemeToggle } from "@/lib/components/ThemeToggle";

export default function ExperiencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-6 w-px bg-[var(--border)]" />
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">neal.fun</span>
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded">
                v2
              </span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="pt-16">{children}</main>
    </div>
  );
}
