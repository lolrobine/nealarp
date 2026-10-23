"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="font-sans bg-[var(--background)] text-[var(--foreground)]">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold mb-2">Something went wrong</h1>
            <p className="text-[var(--muted-foreground)] mb-6">An unexpected error occurred.</p>
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
