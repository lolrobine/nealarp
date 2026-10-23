"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ExperiencesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">💥</div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-[var(--muted-foreground)] mb-6 text-sm">
          This experience crashed. You can try again or go back home.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-[var(--secondary)] rounded-lg font-medium hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-[var(--muted-foreground)] font-mono">
            Digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
