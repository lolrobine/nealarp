"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The row of level, room or map buttons above a board.
 *
 * It used to be `flex flex-wrap`, which is fine for three levels and wrong for
 * ten: on a phone the wrapped rows pushed the board itself below the fold, so
 * the first thing a player saw was a wall of buttons. This scrolls sideways
 * instead, keeps the board at the top of the screen, and borrows the catalogue
 * strip's affordances so it is visibly scrollable: edge fades plus arrow
 * buttons, both derived from real scroll measurements rather than guesswork.
 *
 * Children are passed through untouched, so every button keeps its own label,
 * aria-pressed state and handler.
 */
export function ChoiceStrip({ label, children }: { label: string; children: ReactNode }) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const overflowRight = strip.scrollWidth - strip.clientWidth - strip.scrollLeft > 4;
    setEdges((prev) => {
      const next = { left: strip.scrollLeft > 4, right: overflowRight };
      return prev.left === next.left && prev.right === next.right ? prev : next;
    });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  function nudge(direction: -1 | 1) {
    const strip = stripRef.current;
    if (!strip || typeof strip.scrollBy !== "function") return;
    strip.scrollBy({
      left: direction * Math.max(160, strip.clientWidth * 0.7),
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div
        ref={stripRef}
        onScroll={updateEdges}
        className="flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&>*]:shrink-0 [&>*]:snap-start"
        role="tablist"
        aria-label={label}
      >
        {children}
      </div>

      {edges.left && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--background)] to-transparent"
          />
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label={`Scroll ${label.toLowerCase()} left`}
            className="absolute left-0 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--card)] text-sm shadow-sm"
          >
            ‹
          </button>
        </>
      )}

      {edges.right && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent"
          />
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label={`Scroll ${label.toLowerCase()} right`}
            className="absolute right-0 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--card)] text-sm shadow-sm"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
