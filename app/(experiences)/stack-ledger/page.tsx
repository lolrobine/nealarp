"use client";

import { useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { SegmentedControl } from "@/lib/components/ui/segmented-control";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import {
  barWidth,
  COLS,
  dropBlock,
  efficiency,
  makeQueue,
  nudge,
  scoreTower,
  slideX,
  upcoming,
  WIN_HEIGHT,
  type StackState,
  landing,
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

const isStackSpeed = (v: unknown): v is string => SPEEDS.some((s) => s.id === v);
const isFlag = (v: unknown): v is boolean => typeof v === "boolean";

export default function StackLedgerPage() {
  const record = usePersonalBest("stack-ledger");
  const reducedMotion = usePrefersReducedMotion();
  const [speedId, setSpeedId] = useLocalStorage<string>(
    "nealarp:settings:v1:stack-ledger:speed",
    reducedMotion ? "still" : "normal",
    isStackSpeed
  );
  const [practice, setPractice] = useLocalStorage<boolean>(
    "nealarp:settings:v1:stack-ledger:practice",
    false,
    isFlag
  );
  const [state, setState] = useState<StackState>(() => newRunSafe());
  const [topple, setTopple] = useState<{ col: number; row: number; key: number }[]>([]);
  const [status, setStatus] = useState("");
  const [falling, setFalling] = useState<{ x: number; w: number; from: number } | null>(null);
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
        if (el) el.style.left = `${(x / COLS) * 100}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [falling]);

  function syncX(next: StackState) {
    xRef.current = next.x;
    // Keep the slide phase in step with the position. slideX(t, w) === t on the
    // outward leg, so seeding the tick with x means the next rAF frame carries
    // on from here instead of recomputing the old spot and undoing a nudge.
    tickRef.current = next.x;
  }

  function doDrop() {
    const live = stateRef.current;
    if (live.phase !== "moving" || falling) return;
    // The bar is animated by rAF straight into the DOM, so state.x lags behind
    // what the player sees. Drop where the bar actually IS, or every block lands
    // on column 0 no matter where the player aimed.
    const width = barWidth(live);
    const aimed = Math.max(0, Math.min(COLS - width, Math.round(xRef.current)));
    const s: StackState = { ...live, x: aimed };
    let contact = 0;
    for (let i = 0; i < width; i++) contact = Math.max(contact, s.heights[s.x + i] ?? 0);
    const spawnRow = ROWS - 2;
    const settle = () => {
      // Settle the snapshot taken when the player pressed, not whatever the bar
      // has slid to during the 220 ms fall animation.
      const current = s;
      // Which cells of the bar hang over a lower column? Those snap off.
      const { contact, supported } = landing(current.heights, current.x, barWidth(current));
      const snapped = supported
        .map((isSupported, i) => ({ isSupported, col: current.x + i }))
        .filter((cell) => !cell.isSupported)
        .map((cell, i) => ({ col: cell.col, row: contact, key: Date.now() + i }));
      const next = dropBlock(current);
      setState(next);
      syncX(next);
      setFalling(null);
      // Sighted players watch the overhang tumble away; this says the same thing
      // out loud, so the information is never carried by the animation alone.
      const tallest = Math.max(...next.heights);
      const lostNow = snapped.length;
      setStatus(
        next.phase === "won"
          ? `Tower complete at height ${tallest}. Final score ${scoreTower(next.heights)}.`
          : `${lostNow === 0 ? "Clean landing" : `${lostNow} cell${lostNow === 1 ? "" : "s"} snapped off`}. Tallest column ${tallest} of ${WIN_HEIGHT}.`
      );
      if (snapped.length > 0 && !reducedMotion && speedId !== "still") {
        setTopple(snapped);
        window.setTimeout(() => setTopple([]), 600);
      }
      if (next.phase === "won" && !practice) record.save(100);
      else if (!practice && next.dropped % 4 === 0) record.save(scoreTower(next.heights));
    };
    if (reducedMotion || speedId === "still") {
      settle();
      return;
    }
    // Start at the top of the well, then let CSS carry it down to the
    // column it will actually rest on.
    setFalling({ x: s.x, w: width, from: spawnRow });
    requestAnimationFrame(() => setFalling({ x: s.x, w: width, from: contact }));
    window.setTimeout(settle, 220);
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
            label="Pace"
            value={speedId}
            options={SPEEDS.map((s) => ({ id: s.id, label: s.label }))}
            onChange={setSpeedId}
          />
          {reducedMotion && speedId === "still" && (
            <p className="w-full text-center text-xs text-[var(--muted-foreground)]">
              Motion is paused because your system asks for reduced motion — pick a pace when you
              are ready.
            </p>
          )}
          <Button
            variant={practice ? "default" : "outline"}
            onClick={() => setPractice(!practice)}
            aria-pressed={practice}
          >
            Practice (unscored)
          </Button>
        </div>

        <p role="status" aria-live="polite" className="min-h-6 text-center text-sm font-medium">
          {status}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <span>
            Height <strong>{maxH}</strong> / {WIN_HEIGHT}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Kept <strong>{Math.round(eff * 100)}%</strong> of cells
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Score <strong>{score}</strong>
          </span>
          <PersonalBest record={record} />
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
          className="board relative mx-auto bg-sky-100/50"
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

          {/* Skyline. Every overlay below uses this exact same percentage grid:
              a flex row with margins drifts away from `col / COLS * 100%`, which
              made the bar sit to the right of the column it actually filled. */}
          <div className="absolute inset-0" aria-hidden="true">
            {state.heights.map((h, i) => (
              <div
                key={i}
                className="absolute bottom-0"
                data-col={i}
                data-height={h}
                style={{
                  left: `${(i / COLS) * 100}%`,
                  width: `${(1 / COLS) * 100}%`,
                  height: `${(h / ROWS) * 100}%`,
                  minHeight: h > 0 ? 4 : 0,
                }}
                aria-hidden="true"
              >
                <div
                  className="absolute inset-x-px inset-y-0 rounded-t-md border border-amber-700/60 bg-gradient-to-b from-amber-300 to-amber-500"
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

          {/* overhang snapping off and tumbling away */}
          {topple.map((cell) => (
            <div
              key={cell.key}
              aria-hidden="true"
              className="topple-piece absolute z-20 rounded-md border border-amber-700/60 bg-gradient-to-b from-amber-300 to-amber-500"
              style={{
                left: `${(cell.col / COLS) * 100}%`,
                width: `${(1 / COLS) * 100}%`,
                bottom: `${(cell.row / ROWS) * 100}%`,
                height: `${(1 / ROWS) * 100}%`,
              }}
            />
          ))}

          {/* falling piece animation */}
          {falling && (
            <div
              className="absolute z-10 rounded-md border-2 border-[var(--primary)] bg-[var(--primary)]/80"
              style={{
                left: `${(falling.x / COLS) * 100}%`,
                width: `${(falling.w / COLS) * 100}%`,
                height: `${(1 / ROWS) * 100}%`,
                bottom: `${(falling.from / ROWS) * 100}%`,
                transition: "bottom 220ms cubic-bezier(0.45, 0, 0.9, 0.6)",
              }}
              aria-hidden="true"
            />
          )}

          {/* the moving bar (positioned by rAF) */}
          {!falling && !settled && (
            <div
              id="sl-bar"
              className="absolute z-10 rounded-md border-2 border-[var(--primary)] bg-[var(--primary)]/80"
              style={{
                left: `${(state.x / COLS) * 100}%`,
                width: `${(width / COLS) * 100}%`,
                height: `${(1 / ROWS) * 100}%`,
                top: `${(1 / ROWS) * 100}%`,
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
