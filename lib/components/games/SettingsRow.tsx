"use client";

import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/** Shared segmented/settings row used across game control panels.
 * Behaves like a radio group with keyboard parity (arrow keys). */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: ReactNode; ariaLabel?: string }>;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/60 p-1",
        className
      )}
      onKeyDown={(e) => {
        const idx = options.findIndex((o) => o.value === value);
        if (idx < 0) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const next = options[(idx + 1) % options.length]!;
          onChange(next.value);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          const next = options[(idx - 1 + options.length) % options.length]!;
          onChange(next.value);
        }
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-9 min-w-12 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              active
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** A compact stat pill wrapper to keep status rows consistent. */
export function StatPill({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "success" | "warn";
}) {
  const tones: Record<string, string> = {
    default: "border-[var(--border)] bg-[var(--muted)]/70 text-[var(--foreground)]",
    accent: "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Inline personal-best display (for status bars). The full PersonalBest card
 * from GameFrame is still available for the post-play record panel. */
export function BestPill({ best }: { best: number | null }) {
  return (
    <StatPill tone="accent" aria-label="Personal best">
      <span aria-hidden="true">★</span>
      {best === null ? "—" : best.toFixed(0)}
    </StatPill>
  );
}
