"use client";

import { useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { isSolved, LEVELS, traceBeams, type Level } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

function cellLabel(cell: Level["grid"][0][0]): string {
  if (!cell) return "empty";
  if (cell.kind === "wall") return "wall";
  if (cell.kind === "emitter") return "emitter";
  if (cell.kind === "prism") return "prism";
  if (cell.kind === "mirrorA") return "mirror /";
  if (cell.kind === "mirrorB") return "mirror \\";
  if (cell.kind === "target") return `target needing ${cell.needs}`;
  return "empty";
}

export default function LightLoomPage() {
  const record = usePersonalBest("light-loom");
  const [levelIndex, setLevelIndex] = useState(0);
  const [solved, setSolved] = useState<Record<number, boolean>>({});
  const level = LEVELS[levelIndex] ?? LEVELS[0]!;
  const { lit, litTargets } = traceBeams(level);
  const solvedNow = isSolved(level);
  const targetStatus = level.grid.flatMap((row, y) =>
    row.flatMap((cell, x) => {
      if (cell?.kind !== "target" || !cell.needs) return [];
      const colorName = cell.needs === "r" ? "red" : cell.needs === "g" ? "green" : "blue";
      const isLit = lit.get(`${x},${y}`)?.has(cell.needs) ?? false;
      return [
        {
          key: `${x}-${y}`,
          text: `Target at column ${x + 1}, row ${y + 1} needs ${colorName} — ${isLit ? "lit" : "not lit"}`,
        },
      ];
    })
  );

  function selectLevel(index: number) {
    setLevelIndex(index);
    const target = LEVELS[index] ?? LEVELS[0]!;
    if (isSolved(target)) {
      const next = { ...solved, [index]: true };
      setSolved(next);
      if (Object.keys(next).length === LEVELS.length) record.save(100);
    }
  }

  return (
    <GameFrame
      id="light-loom"
      title="Light Loom"
      intro="Thread light through prisms and mirrors to colour every target. Prisms split white light: red travels straight on, green turns left, blue turns right (Lazors-style optics, original layouts)."
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
              {solved[i] ? " ✓" : ""}
            </Button>
          ))}
        </div>

        <div
          className="board mx-auto grid grid-cols-6 gap-1.5 p-3"
          style={{ width: "min(92vw, 420px)" }}
          role="img"
          aria-label={`Level ${level.name}. ${litTargets.length} targets lit.`}
        >
          {level.grid.map((row, y) =>
            row.map((cell, x) => {
              const colors = lit.get(`${x},${y}`) ?? new Set<string>();
              const isTarget = cell?.kind === "target";
              const targetHit = isTarget && cell.needs && colors.has(cell.needs);
              return (
                <div
                  key={`${x}-${y}`}
                  aria-label={`${x + 1},${y + 1} ${cellLabel(cell)}${colors.size ? `, lit ${[...colors].join(" ")}` : ""}`}
                  className={`flex h-11 items-center justify-center rounded-md text-xs font-bold ${
                    cell?.kind === "wall"
                      ? "bg-[var(--foreground)]/80"
                      : isTarget
                        ? targetHit
                          ? "bg-emerald-400 text-emerald-950"
                          : "bg-[var(--secondary)] border-2 border-rose-400"
                        : cell?.kind === "emitter"
                          ? "bg-amber-300 text-amber-950"
                          : cell?.kind === "prism"
                            ? "bg-violet-300 text-violet-950"
                            : colors.size > 0
                              ? "bg-indigo-300/70"
                              : "bg-[var(--secondary)]"
                  }`}
                >
                  {cell?.kind === "emitter"
                    ? "☀"
                    : cell?.kind === "prism"
                      ? "◭"
                      : cell?.kind === "mirrorA"
                        ? "/"
                        : cell?.kind === "mirrorB"
                          ? "\\"
                          : isTarget
                            ? (cell?.needs ?? "").toUpperCase()
                            : colors.size > 0
                              ? [...colors].join("")
                              : ""}
                </div>
              );
            })
          )}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Lit targets: <strong>{litTargets.length}</strong> · R = red (straight), G = green (left),
          B = blue (right)
        </p>
        <ul
          className="mx-auto list-disc pl-5 text-sm text-[var(--muted-foreground)]"
          aria-live="polite"
        >
          {targetStatus.map((line) => (
            <li key={line.key}>{line.text}</li>
          ))}
        </ul>

        {solvedNow && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">Every target coloured · 100 / 100</p>
            <div className="mt-2 flex justify-center gap-2">
              <Button
                onClick={() => {
                  const next = { ...solved, [levelIndex]: true };
                  setSolved(next);
                  if (Object.keys(next).length === LEVELS.length) record.save(100);
                }}
              >
                Save progress
              </Button>
              {levelIndex + 1 < LEVELS.length && (
                <Button variant="outline" onClick={() => selectLevel(levelIndex + 1)}>
                  Next layout
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Colouring every target">
        <ExampleStep n={1}>
          Remember the prism rule: red travels straight on, green turns left, blue turns right.
          Place prisms where the beam must <em>split</em>, not just bend.
        </ExampleStep>
        <ExampleStep n={2}>
          Mirrors swap beam directions (mirror A maps [1,0,3,2]); work backwards from the targets to
          the lamp when a level looks impossible.
        </ExampleStep>
        <ExampleResult>Colour all four targets on each of the four levels for 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
