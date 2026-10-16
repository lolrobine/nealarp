import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-[var(--muted-foreground)] mb-8">Page not found</p>
        <Link
          href="/"
          className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
