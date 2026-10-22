import type { ReactNode } from "react";
import { scoreBand } from "./GameFrame";

/**
 * The end-of-round panel. Thirteen games had hand-copied versions of this with
 * the headline, the score and the buttons all crammed into one bold sentence,
 * which made the score the least readable thing on a screen that exists to
 * show it. One component now owns the chrome and the hierarchy:
 *
 *   headline -> score and band -> supporting detail -> what to do next
 *
 * `score` is rendered as a single text node ("92 / 100") so a test or a screen
 * reader never meets it split across elements.
 */
export function WinScreen({
  headline,
  score,
  detail,
  children,
}: {
  headline: ReactNode;
  score?: number;
  detail?: ReactNode;
  children?: ReactNode;
}) {
  const clamped = score === undefined ? null : Math.max(0, Math.min(100, score));
  const printed =
    clamped === null ? null : Number.isInteger(clamped) ? `${clamped}` : clamped.toFixed(1);

  return (
    <div
      className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-5 text-center"
      aria-live="polite"
    >
      <p className="text-2xl font-bold tracking-tight">{headline}</p>

      {clamped !== null && (
        <div className="mx-auto mt-3 max-w-xs">
          <p className="text-4xl font-bold tabular-nums leading-none">{`${printed} / 100`}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
            {scoreBand(clamped)}
          </p>
          <div className="score-meter mt-2" aria-hidden="true">
            <div className="score-meter-fill" style={{ width: `${clamped}%` }} />
          </div>
        </div>
      )}

      {detail && <div className="mt-3 text-sm text-[var(--muted-foreground)]">{detail}</div>}

      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
