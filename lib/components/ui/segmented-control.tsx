"use client";

import { useId } from "react";

export type SegmentedOption<T extends string> = {
  id: T;
  label: string;
  /** Optional second line, e.g. a pace in seconds or a remaining count. */
  hint?: string;
  disabled?: boolean;
};

/**
 * Shared single-select settings row used by the games (pace, tool, mode).
 *
 * Built on native radio inputs so arrow-key navigation, grouping and screen-reader
 * semantics come from the platform rather than hand-rolled key handling. The visible
 * control is the label, so every segment is a full-size touch target.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (id: T) => void;
  className?: string;
}) {
  const name = useId();
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/60 p-1"
      >
        {options.map((option) => {
          const active = option.id === value;
          return (
            <label
              key={option.id}
              className={`relative flex min-h-10 cursor-pointer select-none items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ring)] ${
                option.disabled
                  ? "cursor-not-allowed opacity-50"
                  : active
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={active}
                disabled={option.disabled}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              <span className="flex flex-col items-center leading-tight">
                <span>{option.label}</span>
                {option.hint && (
                  <span className={`text-[0.7rem] ${active ? "opacity-80" : "opacity-70"}`}>
                    {option.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
