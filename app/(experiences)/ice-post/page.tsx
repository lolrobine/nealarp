"use client";

import { useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { applySlide, initialState, isWin, LEVELS, scoreRun, type SlideState } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const DIR_LABELS = ["up", "right", "down", "left"];

export default function IcePostPage() {
  const record = usePersonalBest("ice-post");
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex] ?? LEVELS[0]!;
  const [history, setHistory] = useState<SlideState[]>(() => [initialState(level)]);
  const [solved, setSolved] = useState<Record<number, number>>({});

  const state = history[history.length - 1] ?? initialState(level);
  const moves = history.length - 1;
  const won = isWin(level, state);
  const postman = level.patrol[state.pi] ?? level.patrol[0]!;

  function selectLevel(index: number) {
    const target = LEVELS[index] ?? LEVELS[0]!;
    setLevelIndex(index);
    setHistory([initialState(target)]);
  }

  function doSlide(dir: number) {
    if (won) return;
    const next = applySlide(level, state, dir);
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
      id="ice-post"
      title="Ice Post"
      intro="Slide until something stops you: walls, edges, or the postman on his round. He moves one step after every slide — deliver to the green postbox."
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
          className="board mx-auto grid grid-cols-6 gap-1.5 p-3"
          style={{ width: "min(92vw, 420px)" }}
          role="img"
          aria-label={`You are at ${state.x + 1},${state.y + 1}. Postman at ${postman.x + 1},${postman.y + 1}. Postbox at ${level.goal.x + 1},${level.goal.y + 1}.`}
        >
          {level.rows.map((row, y) =>
            row.split("").map((cell, x) => {
              const isWall = cell === "#";
              const isPawn = state.x === x && state.y === y;
              const isPostman = postman.x === x && postman.y === y;
              const isGoal = level.goal.x === x && level.goal.y === y;
              const isPatrol = level.patrol.some((p) => p.x === x && p.y === y);
              return (
                <div
                  key={`${x}-${y}`}
                  className={`flex h-11 items-center justify-center rounded-md text-xs font-bold ${
                    isWall
                      ? "bg-[var(--foreground)]/80"
                      : isPawn
                        ? "bg-sky-500 text-white"
                        : isPostman
                          ? "bg-rose-500 text-white"
                          : isGoal
                            ? "bg-emerald-400 text-emerald-950"
                            : isPatrol
                              ? "bg-[var(--secondary)] border border-rose-300"
                              : "bg-[var(--secondary)]"
                  }`}
                >
                  {isPawn ? "◆" : isPostman ? "✉" : isGoal ? "⌂" : ""}
                </div>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DIR_LABELS.map((label, dir) => (
            <Button key={label} variant="secondary" disabled={won} onClick={() => doSlide(dir)}>
              Slide {label}
            </Button>
          ))}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Moves: <strong>{moves}</strong> / par {level.par} · Postman step {state.pi + 1} of{" "}
          {level.patrol.length}
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
              Delivered in {moves} move{moves === 1 ? "" : "s"} · {scoreRun(moves, level.par)} / 100
            </p>
            {levelIndex + 1 < LEVELS.length && (
              <Button className="mt-2" onClick={() => selectLevel(levelIndex + 1)}>
                Next round
              </Button>
            )}
          </div>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="A par delivery round">
        <ExampleStep n={1}>
          You slide until something stops you — aim at the <em>end square</em>, not the path. Walls
          and edges are your brakes.
        </ExampleStep>
        <ExampleStep n={2}>
          The postman steps once after each of your slides. Count his round while you plan: pars run
          3–7 slides and are BFS-minimums.
        </ExampleStep>
        <ExampleResult>Deliver at par on all ten rounds for the full score.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
