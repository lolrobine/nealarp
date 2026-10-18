"use client";

import { useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  applyHop,
  hopTarget,
  initialState,
  isWin,
  LEVELS,
  scoreRun,
  type HexState,
  type Hop,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const DIR_LABELS = ["E", "W", "NW", "NE", "SW", "SE"];

export default function LavaLinksPage() {
  const record = usePersonalBest("lava-links");
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex] ?? LEVELS[0]!;
  const [history, setHistory] = useState<HexState[]>(() => [initialState(level)]);
  const [solved, setSolved] = useState<Record<number, number>>({});

  const state = history[history.length - 1] ?? initialState(level);
  const moves = history.length - 1;
  const won = isWin(level, state);

  function selectLevel(index: number) {
    const target = LEVELS[index] ?? LEVELS[0]!;
    setLevelIndex(index);
    setHistory([initialState(target)]);
  }

  function doHop(hop: Hop) {
    if (won) return;
    const next = applyHop(level, state, hop);
    if (next === state) return;
    const nextHistory = [...history, next];
    setHistory(nextHistory);
    if (isWin(level, next)) {
      const movesUsed = nextHistory.length - 1;
      const nextSolved = {
        ...solved,
        [levelIndex]: Math.min(solved[levelIndex] ?? 999, movesUsed),
      };
      setSolved(nextSolved);
      if (Object.keys(nextSolved).length === LEVELS.length) {
        const total =
          LEVELS.reduce((sum, l, i) => sum + scoreRun(nextSolved[i] ?? l.par, l.par), 0) /
          LEVELS.length;
        record.save(Math.round(total * 10) / 10);
      }
    }
  }

  return (
    <GameFrame
      id="lava-links"
      title="Lava Links"
      intro="Hop one or two tiles across the hex chain. The tile you leave crumbles into lava — plan every landing."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Levels">
          {LEVELS.map((l, i) => (
            <Button
              key={l.name}
              variant={i === levelIndex ? "default" : "outline"}
              onClick={() => selectLevel(i)}
              aria-pressed={i === levelIndex}
            >
              {i + 1}. {l.name}
              {solved[i] !== undefined ? " ✓" : ""}
            </Button>
          ))}
        </div>

        <div
          className="board mx-auto grid gap-1.5 p-3"
          style={{ width: "min(92vw, 380px)" }}
          role="group"
          aria-label={`${level.name}. You are at ${state.x + 1},${state.y + 1}. Goal at ${level.goal.x + 1},${level.goal.y + 1}.`}
        >
          {level.rows.map((row, y) => (
            <div key={y} className="flex gap-1" style={{ marginLeft: y % 2 ? "10%" : 0 }}>
              {row.split("").map((cell, x) => {
                const gone = state.gone.includes(`${x},${y}`);
                const isPawn = state.x === x && state.y === y;
                const isGoal = level.goal.x === x && level.goal.y === y;
                const reachable =
                  !won &&
                  !isPawn &&
                  [0, 1, 2, 3, 4, 5].some((dir) =>
                    ([1, 2] as const).some((steps) => {
                      const t = hopTarget(level, state, { dir, steps });
                      return t && t[0] === x && t[1] === y;
                    })
                  );
                return (
                  <button
                    key={x}
                    type="button"
                    disabled={!reachable}
                    onClick={() => {
                      for (const dir of [0, 1, 2, 3, 4, 5]) {
                        for (const steps of [1, 2] as const) {
                          const t = hopTarget(level, state, { dir, steps });
                          if (t && t[0] === x && t[1] === y) {
                            doHop({ dir, steps });
                            return;
                          }
                        }
                      }
                    }}
                    aria-label={`${x + 1},${y + 1} ${gone ? "crumbled" : cell === "#" ? "tile" : "lava"}${
                      isGoal ? " goal" : ""
                    }${reachable ? " (hop here)" : ""}`}
                    className={`h-10 w-10 rounded-full text-xs font-bold ${
                      isPawn
                        ? "bg-amber-500 text-white"
                        : gone || cell === "."
                          ? "bg-orange-900/70 text-transparent"
                          : isGoal
                            ? "bg-emerald-400 text-emerald-950"
                            : reachable
                              ? "bg-[var(--secondary)] border-2 border-amber-400"
                              : "bg-[var(--secondary)]"
                    }`}
                  >
                    {isPawn ? "◆" : isGoal ? "★" : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((dir) =>
            ([1, 2] as const).map((steps) => (
              <Button
                key={`${dir}-${steps}`}
                variant="secondary"
                disabled={won}
                onClick={() => doHop({ dir, steps })}
                aria-label={`Hop ${steps} tile${steps > 1 ? "s" : ""} ${DIR_LABELS[dir]}`}
              >
                {steps === 2 ? "⤤" : "→"} {DIR_LABELS[dir]} {steps}
              </Button>
            ))
          )}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Moves: <strong>{moves}</strong> / par {level.par}
        </p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setHistory(history.slice(0, -1))}
            disabled={history.length <= 1}
          >
            Undo
          </Button>
          <Button variant="outline" onClick={() => selectLevel(levelIndex)}>
            Reset
          </Button>
        </div>

        {won && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">
              Crossed in {moves} move{moves === 1 ? "" : "s"} · {scoreRun(moves, level.par)} / 100
            </p>
            {levelIndex + 1 < LEVELS.length && (
              <Button className="mt-2" onClick={() => selectLevel(levelIndex + 1)}>
                Next level
              </Button>
            )}
          </div>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Clearing a level at par">
        <ExampleStep n={1}>
          Hop one or two tiles along the chain; the tile you leave crumbles. Plan the LAST landing
          first — every early hop removes a future option.
        </ExampleStep>
        <ExampleStep n={2}>
          Each level is BFS-solved at its par (2–5 hops). Over par? Restart and try the other first
          hop — the crumbling rule makes first moves decisive.
        </ExampleStep>
        <ExampleResult>All seven levels at par — scoreRun keeps the full 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
