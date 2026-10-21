"use client";

import { useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { BestPill, SegmentedControl } from "@/lib/components/games/SettingsRow";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import {
  barWidth,
  COLS,
  dropBlock,
  efficiency,
  landing,
  makeQueue,
  nudge,
  scoreTower,
  slideX,
  upcoming,
  WIN_HEIGHT,
  type StackState,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const SPEEDS = [
  { id: "still", label: "Still", factor: 0 },
  { id: "slow", label: "Practice pace", factor: 0.55 },
  { id: "normal", label: "Normal", factor: 1 },
  { id: "fast", label: "Fast", factor: 1.6 },
];

/** Visual grid: row 0 is the sky, the floor is below. */
const ROWS = WIN_HEIGHT + 3;

export default function StackLedgerPage() {
  const record = usePersonalBest("stack-ledger");
  const reducedMotion = usePrefersReducedMotion();
  const [speedId, setSpeedId] = useLocalStorage<string>(
    "nealarp:settings:v1:stack-ledger:speed",
    reducedMotion ? "still" : "normal"
  );
  const [practice, setPractice] = useLocalStorage<boolean>(
    "nealarp:settings:v1:stack-ledger:practice",
    false
  );
  const [state, setState] = useState<StackState>(() => newRunSafe());
  const [falling, setFalling] = useState<{
    x: number;
    w: number;
    rows: number;
    debris: Array<{ col: number; dropRows: number }>;
  } | null>(null);
  const tickRef = useRef(state.tick);
  const xRef = useRef(state.x);
  const speedRef = useRef(1);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    speedRef.current = SPEEDS.find((s) => s.id === speedId)?.factor ?? 1;
  }, [speedId]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const s = stateRef.current;
      if (s.phase === "moving" && speedRef.current > 0 && !falling) {
        tickRef.current += (dt / 16.7) * speedRef.current;
        const x = slideX(tickRef.current, barWidth(s));
        xRef.current = x;
        const el = document.getElementById("sl-bar");
        if (el) el.style.left = `calc(${(x / COLS) * 100}% + 2px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [falling]);

  function syncX(next: StackState) {
    xRef.current = next.x;
    tickRef.current = next.tick;
  }

  function doDrop() {
    const s = stateRef.current;
    if (s.phase !== "moving" || falling) return;
    // Animate the fall first (unless reduced motion), then settle the physics.
    const width = barWidth(s);
    const { contact, supported } = landing(s.heights, s.x, width);
    const rows = Math.max(1, ROWS - 3 - contact);
    const debris: Array<{ col: number; dropRows: number }> = [];
    for (let i = 0; i < width; i++) {
      if (!supported[i]) {
        // overhang piece tumbles past the skyline
        const under = s.heights[s.x + i] ?? 0;
        debris.push({ col: s.x + i, dropRows: Math.max(2, ROWS - 3 - under) });
      }
    }
    const settle = () => {
      const next = dropBlock(stateRef.current);
      setState(next);
      syncX(next);
      setFalling(null);
      if (next.phase === "won" && !practice) record.save(100);
      else if (!practice && next.dropped % 4 === 0) record.save(scoreTower(next.heights));
    };
    if (reducedMotion || speedId === "still") {
      settle();
      return;
    }
    setFalling({ x: s.x, w: width, rows, debris });
    window.setTimeout(settle, 360);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "ArrowLeft" || e.key === "a") {
        e.preventDefault();
        const next = nudge(s, -1);
        setState(next);
        syncX(next);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        e.preventDefault();
        const next = nudge(s, 1);
        setState(next);
        syncX(next);
      } else if (e.key === " " || e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        doDrop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [falling, practice, speedId, reducedMotion]);

  const width = barWidth(state);
  const queuePreview = upcoming(state);
  const maxH = Math.max(0, ...state.heights);
  const score = scoreTower(state.heights);
  const eff = efficiency(state);
  const settled = state.phase !== "moving";

  return (
    <GameFrame
      id="stack-ledger"
      title="Stack Ledger"
      intro="Slide the bar and drop it onto the skyline. It lands rigid on the tallest column of its span; anything hanging over a lower column snaps off. The whole width queue is visible up front — plan the tower, no luck involved. Reach 20 to close the ledger."
    >
      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SegmentedControl
            label="Drop pace"
            value={speedId}
            onChange={(v) => setSpeedId(v)}
            options={SPEEDS.map((s) => ({ value: s.id, label: s.label }))}
          />
          <SegmentedControl
            label="Mode"
            value={practice ? "practice" : "scored"}
            onChange={(v) => setPractice(v === "practice")}
            options={[
              { value: "scored", label: "Scored" },
              { value: "practice", label: "Practice" },
            ]}
          />
          {reducedMotion && speedId === "still" && (
            <p className="w-full text-center text-xs text-[var(--muted-foreground)]">
              Motion is paused because your system asks for reduced motion — pick a pace when you
              are ready.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="stat-pill">
            Height <strong className="tabular-nums">{maxH}</strong> / {WIN_HEIGHT}
          </span>
          <span className="stat-pill">
            Kept <strong className="tabular-nums">{Math.round(eff * 100)}%</strong>
          </span>
          <span className="stat-pill">
            Score <strong className="tabular-nums">{score}</strong>
          </span>
          <BestPill best={record.best} />
        </div>

        {/* The queue: every upcoming width, known in advance. */}
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Upcoming widths"
        >
          <span className="text-xs text-[var(--muted-foreground)]">Next:</span>
          <span
            className="inline-flex h-8 items-center rounded-md border-2 border-[var(--primary)] bg-[var(--primary)]/10 px-2 font-mono text-sm font-semibold"
            aria-label={`Moving bar, width ${width}`}
          >
            ▸ {width}
          </span>
          {queuePreview.map((w, i) => (
            <span
              key={i}
              className="inline-flex h-8 items-center rounded-md border border-[var(--border)] bg-[var(--muted)] px-2 font-mono text-sm"
              aria-label={`Upcoming width ${w}`}
            >
              {w}
            </span>
          ))}
        </div>

        <div
          className="relative mx-auto overflow-hidden rounded-xl border border-[var(--border)] bg-sky-100/50"
          style={{ width: "min(92vw, 420px)", height: "min(78vw, 380px)" }}
          role="img"
          aria-label={`Tower of ${COLS} columns, tallest ${maxH} blocks. Moving bar width ${width} at column ${state.x}.`}
        >
          {/* target line */}
          <div
            className="absolute inset-x-0 border-t-2 border-dashed border-emerald-600/60"
            style={{ top: `${((ROWS - 2 - WIN_HEIGHT) / ROWS) * 100}%` }}
            aria-hidden="true"
          >
            <span className="absolute right-1 -top-4 text-[10px] font-semibold text-emerald-700">
              goal {WIN_HEIGHT}
            </span>
          </div>

          {/* skyline */}
          <div className="absolute inset-x-0 bottom-0 flex items-end" style={{ height: "100%" }}>
            {state.heights.map((h, i) => (
              <div
                key={i}
                className="relative mx-px flex-1"
                style={{ height: `${(h / ROWS) * 100}%`, minHeight: h > 0 ? 4 : 0 }}
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-t-md border border-amber-700/60 bg-gradient-to-b from-amber-300 to-amber-500"
                  style={{ opacity: h > 0 ? 1 : 0 }}
                />
                {h > 0 && (
                  <span className="absolute inset-x-0 top-0 text-center text-[10px] font-semibold text-amber-950">
                    {h}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* falling piece animation */}
          {falling && (
            <>
              <div
                className="absolute z-10 rounded-md border-2 border-[var(--primary)] bg-[var(--primary)]/80"
                style={{
                  left: `calc(${(falling.x / COLS) * 100}% + 2px)`,
                  width: `calc(${(falling.w / COLS) * 100}% - 4px)`,
                  height: 14,
                  top: 8,
                  transition: "transform 260ms cubic-bezier(.55,.05,.7,.3)",
                  transform: `translateY(${falling.rows * 14}px)`,
                }}
                aria-hidden="true"
              />
              {/* overhang debris: pieces that snap off and tumble past the skyline */}
              {falling.debris.map((d, i) => (
                <div
                  key={i}
                  className="absolute z-10 rounded-sm border border-red-400/70 bg-red-400/70"
                  style={{
                    left: `calc(${(d.col / COLS) * 100}% + 2px)`,
                    width: `calc(${(1 / COLS) * 100}% - 4px)`,
                    height: 12,
                    top: 8,
                    transition:
                      "transform 360ms cubic-bezier(.45,.05,.7,.3), opacity 360ms ease-in",
                    transform: `translate(${i % 2 === 0 ? -6 : 6}px, ${d.dropRows * 14 + 6}px) rotate(${i % 2 === 0 ? -28 : 28}deg)`,
                    opacity: 0,
                  }}
                  aria-hidden="true"
                />
              ))}
            </>
          )}

          {/* the moving bar (positioned by rAF) */}
          {!falling && !settled && (
            <div
              id="sl-bar"
              className="absolute z-10 rounded-md border-2 border-[var(--primary)] bg-[var(--primary)]/80"
              style={{
                left: `calc(${(state.x / COLS) * 100}% + 2px)`,
                width: `calc(${(width / COLS) * 100}% - 4px)`,
                height: 14,
                top: 8,
              }}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const next = nudge(stateRef.current, -1);
              setState(next);
              syncX(next);
            }}
            aria-label="Move bar left"
          >
            ◀ Left
          </Button>
          <Button onClick={doDrop} disabled={settled || Boolean(falling)} aria-label="Drop bar">
            ▼ Drop
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const next = nudge(stateRef.current, 1);
              setState(next);
              syncX(next);
            }}
            aria-label="Move bar right"
          >
            Right ▶
          </Button>
          {settled && (
            <Button
              variant="outline"
              onClick={() => {
                const fresh = newRunSafe();
                setState(fresh);
                syncX(fresh);
              }}
            >
              Play again
            </Button>
          )}
        </div>

        {state.phase === "won" && (
          <p className="text-center text-sm font-semibold text-emerald-700">
            Ledger closed at {maxH} — score {score}. {practice ? "Practice run." : "Recorded."}
          </p>
        )}

        <p className="text-center text-xs text-[var(--muted-foreground)]">
          Keyboard: ← → (or A/D) move the bar, Space drops. Every upcoming width is shown — the only
          question is where it fits best.
        </p>
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Closing the ledger at 20">
        <ExampleStep n={1}>
          Read the queue — every upcoming width is shown, so place wide bars over flat stretches and
          save narrow ones for peaks.
        </ExampleStep>
        <ExampleStep n={2}>
          The bar lands rigid on the tallest column of its span; anything hanging over a lower
          column snaps off. Keep the skyline within one height and nothing is wasted.
        </ExampleStep>
        <ExampleResult>
          Height 20 → score = 5 × 20 = 100. Every drop planned, no luck involved.
        </ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}

function newRunSafe(): StackState {
  // Lazy initialiser: stable across renders without breaking purity rules.
  return {
    heights: Array<number>(COLS).fill(0),
    queue: makeQueue(`stack-${Math.random().toString(36).slice(2)}`),
    cursor: 0,
    x: 0,
    tick: 0,
    phase: "moving",
    dropped: 0,
    kept: 0,
    lost: 0,
  };
}
