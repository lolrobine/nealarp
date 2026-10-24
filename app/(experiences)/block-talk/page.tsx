"use client";

import { useEffect, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { allCells, comparePatterns, generatePattern, scoreBlockTalk } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const MEMORISE_MS = 4000;

/** Every state of a cell has to survive without its colour. */
export function cellLabel(
  cell: string,
  state: { showTarget: boolean; missed: boolean; extra: boolean; placed: boolean }
): string {
  if (state.showTarget) return `${cell} filled`;
  if (state.missed) return `${cell} missed`;
  if (state.extra) return `${cell} should have stayed empty`;
  if (state.placed) return `${cell} placed`;
  return cell;
}

export default function BlockTalkPage() {
  const record = usePersonalBest("block-talk");
  const reducedMotion = usePrefersReducedMotion();
  const [seed] = useState(() => `block-talk:${Date.now()}`);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"show" | "build" | "result">("show");
  const [placed, setPlaced] = useState<string[]>([]);
  // Deriving this instead of seeding state with it matters: the media query
  // hook reports its server default on the very first client render, so
  // useState(reducedMotion) captured false and the opening round flashed at
  // exactly the people who asked it not to.
  const [hideRequested, setHideRequested] = useState(false);
  const timerDone = hideRequested || reducedMotion;

  const pattern = generatePattern(seed, round);
  const comparison = phase === "result" ? comparePatterns(pattern, placed) : null;

  useEffect(() => {
    if (phase !== "show" || timerDone) return;
    const timer = setTimeout(() => setHideRequested(true), MEMORISE_MS);
    return () => clearTimeout(timer);
  }, [phase, timerDone, round]);

  function toggle(cell: string) {
    if (phase !== "build") return;
    setPlaced((list) => (list.includes(cell) ? list.filter((c) => c !== cell) : [...list, cell]));
  }

  function nextRound() {
    setRound(round + 1);
    setPlaced([]);
    setHideRequested(false);
    setPhase("show");
  }

  return (
    <GameFrame
      id="block-talk"
      title="Block Talk"
      intro="One player describes a block pattern on the A1–D4 grid; the partner rebuilds it from the words alone. Solo, the pattern flashes for four seconds and memory takes the partner's seat (inspired by Keep Talking and Nobody Explodes)."
    >
      <Card className="p-6 space-y-4">
        <div className="text-center">
          <p className="text-sm text-[var(--muted-foreground)]">Round {round + 1}</p>
          <p className="text-lg font-bold" aria-live="polite">
            {phase === "show"
              ? timerDone
                ? "Memorise — then the grid hides."
                : `Study the pattern… (${MEMORISE_MS / 1000}s)`
              : phase === "build"
                ? "Rebuild the pattern from memory."
                : "Compare and score."}
          </p>
        </div>

        <div
          className="board grid-texture mx-auto grid gap-1 p-3"
          style={{ width: "min(92vw, 380px)", gridTemplateColumns: "repeat(4, 1fr)" }}
          role="group"
          aria-label="A1 to D4 block grid"
        >
          {allCells().map((cell) => {
            const showTarget = phase === "show" && !timerDone;
            const isTarget = pattern.includes(cell);
            const isPlaced = placed.includes(cell);
            const isMiss = phase === "result" && comparison?.missed.includes(cell);
            const isExtra = phase === "result" && comparison?.extra.includes(cell);
            return (
              <button
                key={cell}
                type="button"
                onClick={() => toggle(cell)}
                aria-pressed={phase === "build" ? isPlaced : undefined}
                disabled={phase !== "build"}
                aria-label={cellLabel(cell, {
                  showTarget: showTarget && isTarget,
                  missed: !!isMiss,
                  extra: !!isExtra,
                  placed: isPlaced,
                })}
                className={`flex aspect-square items-center justify-center rounded-md border text-xs font-mono ${
                  showTarget && isTarget
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : isMiss
                      ? "bg-rose-300 border-rose-500 text-rose-900"
                      : isExtra
                        ? "bg-amber-300 border-amber-500 text-amber-900"
                        : isPlaced
                          ? "bg-[var(--primary)]/30 text-[var(--foreground)] border-[var(--primary)]"
                          : "bg-[var(--secondary)] border-[var(--border)]"
                }`}
              >
                <span>{cell}</span>
                {(isMiss || isExtra) && (
                  <span aria-hidden="true" className="ml-1 text-[10px] font-bold uppercase">
                    {isMiss ? "miss" : "extra"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {phase === "show" && (
          <div className="flex justify-center gap-2">
            <Button
              variant={timerDone ? "default" : "outline"}
              onClick={() => setHideRequested(true)}
              disabled={timerDone}
            >
              Hide now
            </Button>
            {timerDone && <Button onClick={() => setPhase("build")}>Start rebuilding</Button>}
          </div>
        )}

        {phase === "build" && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => {
                // Banked on reveal. "Save score" used to sit next to "Next
                // pattern" on the result screen, and picking the wrong one
                // threw the round away.
                record.save(scoreBlockTalk(comparePatterns(pattern, placed).overlapPct));
                setPhase("result");
              }}
              disabled={placed.length === 0}
            >
              Reveal
            </Button>
            <Button variant="outline" onClick={() => setPlaced([])}>
              Clear
            </Button>
          </div>
        )}

        {comparison && (
          <WinScreen
            headline={`Overlap ${comparison.overlapPct}%`}
            score={scoreBlockTalk(comparison.overlapPct)}
            detail={
              <>
                Shared: {comparison.shared} · Missed: {comparison.missed.join(", ") || "none"} ·
                Extra: {comparison.extra.join(", ") || "none"}
              </>
            }
          >
            <Button variant="outline" onClick={nextRound}>
              Next pattern
            </Button>
          </WinScreen>
        )}

        <p className="text-xs text-[var(--muted-foreground)]">
          Two-player version: describe cells aloud (column letter, row number) instead of flashing
          the grid — overlaps score exactly the same way.
        </p>
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Describing a pattern exactly">
        <ExampleStep n={1}>
          Speak the grid: &quot;B2, C3 and D1 filled — B2 is the tall one&quot;. Column-row
          coordinates beat colours and shapes in words.
        </ExampleStep>
        <ExampleStep n={2}>
          Solo mode flashes the A1–D4 pattern for four seconds: memorise corners and count, then
          rebuild. Score is the pixel overlap (IoU) of both grids.
        </ExampleStep>
        <ExampleResult>Near-identical rebuilds score close to 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
