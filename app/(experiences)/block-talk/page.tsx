"use client";

import { useEffect, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { allCells, comparePatterns, generatePattern, scoreBlockTalk } from "./logic";

const MEMORISE_MS = 4000;

export default function BlockTalkPage() {
  const record = usePersonalBest("block-talk");
  const reducedMotion = usePrefersReducedMotion();
  const [seed] = useState(() => `block-talk:${Date.now()}`);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"show" | "build" | "result">("show");
  const [placed, setPlaced] = useState<string[]>([]);
  const [timerDone, setTimerDone] = useState(reducedMotion);

  const pattern = generatePattern(seed, round);
  const comparison = phase === "result" ? comparePatterns(pattern, placed) : null;

  useEffect(() => {
    if (phase !== "show" || timerDone) return;
    const timer = setTimeout(() => setTimerDone(true), MEMORISE_MS);
    return () => clearTimeout(timer);
  }, [phase, timerDone, round]);

  function toggle(cell: string) {
    if (phase !== "build") return;
    setPlaced((list) => (list.includes(cell) ? list.filter((c) => c !== cell) : [...list, cell]));
  }

  function nextRound() {
    setRound(round + 1);
    setPlaced([]);
    setTimerDone(reducedMotion);
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
          className="mx-auto grid gap-1"
          style={{ width: "min(92vw, 380px)", gridTemplateColumns: "repeat(4, 1fr)" }}
          role="grid"
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
                role="gridcell"
                onClick={() => toggle(cell)}
                disabled={phase !== "build"}
                aria-label={`${cell}${isPlaced ? " placed" : ""}`}
                className={`flex aspect-square items-center justify-center rounded-md border text-xs font-mono ${
                  showTarget && isTarget
                    ? "bg-indigo-500 text-white border-indigo-600"
                    : isMiss
                      ? "bg-rose-300 border-rose-500 text-rose-900"
                      : isExtra
                        ? "bg-amber-300 border-amber-500 text-amber-900"
                        : isPlaced
                          ? "bg-indigo-400 text-white border-indigo-500"
                          : "bg-[var(--secondary)] border-[var(--border)]"
                }`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {phase === "show" && (
          <div className="flex justify-center gap-2">
            <Button
              variant={timerDone ? "default" : "outline"}
              onClick={() => setTimerDone(true)}
              disabled={timerDone}
            >
              Hide now
            </Button>
            {timerDone && <Button onClick={() => setPhase("build")}>Start rebuilding</Button>}
          </div>
        )}

        {phase === "build" && (
          <div className="flex justify-center gap-2">
            <Button onClick={() => setPhase("result")} disabled={placed.length === 0}>
              Reveal
            </Button>
            <Button variant="outline" onClick={() => setPlaced([])}>
              Clear
            </Button>
          </div>
        )}

        {comparison && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">
              Overlap {comparison.overlapPct}% · score {scoreBlockTalk(comparison.overlapPct)} / 100
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Shared: {comparison.shared} · Missed: {comparison.missed.join(", ") || "none"} ·
              Extra: {comparison.extra.join(", ") || "none"}
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <Button onClick={() => record.save(scoreBlockTalk(comparison.overlapPct))}>
                Save score
              </Button>
              <Button variant="outline" onClick={nextRound}>
                Next pattern
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)]">
          Two-player version: describe cells aloud (column letter, row number) instead of flashing
          the grid — overlaps score exactly the same way.
        </p>
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
