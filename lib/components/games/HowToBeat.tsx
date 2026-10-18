"use client";

import type { ReactNode } from "react";

/** Collapsible worked example: concrete moves that beat the game, spelled out. */
export function HowToBeat({
  title = "How to beat it",
  summary = "A worked example, step by step",
  children,
}: {
  title?: string;
  summary?: string;
  children: ReactNode;
}) {
  return (
    <details className="group mx-auto w-full max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--card)]/60 open:bg-[var(--card)]">
      <summary className="cursor-pointer select-none list-none px-5 py-4 text-left">
        <span className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {title}
            </span>
            <span className="mt-1 block text-base font-semibold">{summary}</span>
          </span>
          <span
            aria-hidden="true"
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition-transform group-open:rotate-180"
          >
            ▾ show
          </span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed">
        {children}
      </div>
    </details>
  );
}

/** One numbered move in a worked example. */
export function ExampleStep({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]"
      >
        {n}
      </span>
      <span>{children}</span>
    </p>
  );
}

/** The result line of a worked example (score, route, timing). */
export function ExampleResult({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-4 py-2.5 font-medium text-emerald-700 dark:text-emerald-300">
      {children}
    </p>
  );
}
