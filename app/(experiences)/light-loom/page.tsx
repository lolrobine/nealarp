"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { SegmentedControl } from "@/lib/components/ui/segmented-control";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  canPlace,
  isSolved,
  LEVELS,
  traceBeams,
  withPlacements,
  type Level,
  type PieceKind,
  type Placement,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const PIECE_LABEL: Record<PieceKind, string> = {
  prism: "Prism",
  mirrorA: "Mirror /",
  mirrorB: "Mirror \\",
};
const PIECE_GLYPH: Record<PieceKind, string> = { prism: "◭", mirrorA: "/", mirrorB: "\\" };

function cellLabel(cell: Level["grid"][0][0]): string {
  if (!cell) return "empty";
  if (cell.kind === "wall") return "wall";
  if (cell.kind === "emitter") return "lamp";
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
  const [placementsByLevel, setPlacementsByLevel] = useState<Record<number, Placement[]>>({});
  const [selected, setSelected] = useState<PieceKind | null>(null);

  const level = LEVELS[levelIndex] ?? LEVELS[0]!;
  const placements = useMemo(
    () => placementsByLevel[levelIndex] ?? [],
    [placementsByLevel, levelIndex]
  );
  const composed = useMemo(() => withPlacements(level, placements), [level, placements]);
  const { lit, litTargets } = useMemo(() => traceBeams(composed), [composed]);
  const solvedNow = useMemo(() => isSolved(composed), [composed]);

  // Pieces still waiting in the tray, counted per kind.
  const remaining = useMemo(() => {
    const counts = new Map<PieceKind, number>();
    for (const kind of level.tray) counts.set(kind, (counts.get(kind) ?? 0) + 1);
    for (const placement of placements) {
      counts.set(placement.kind, (counts.get(placement.kind) ?? 0) - 1);
    }
    return counts;
  }, [level.tray, placements]);

  const trayOptions = useMemo(() => {
    const kinds = [...new Set(level.tray)];
    return kinds.map((kind) => ({
      id: kind,
      label: PIECE_LABEL[kind],
      hint: `${Math.max(0, remaining.get(kind) ?? 0)} left`,
      disabled: (remaining.get(kind) ?? 0) <= 0,
    }));
  }, [level.tray, remaining]);

  // Default to the first piece that is still available.
  const activePiece =
    selected && (remaining.get(selected) ?? 0) > 0
      ? selected
      : (trayOptions.find((option) => !option.disabled)?.id ?? null);

  const totalTargets = level.grid
    .flat()
    .filter((cell) => cell.kind === "target" && cell.needs).length;

  function setPlacements(next: Placement[]) {
    setPlacementsByLevel((prev) => ({ ...prev, [levelIndex]: next }));
    const nextSolved = isSolved(withPlacements(level, next));
    if (nextSolved && !solved[levelIndex]) {
      const nextRecord = { ...solved, [levelIndex]: true };
      setSolved(nextRecord);
      record.save((Object.keys(nextRecord).length / LEVELS.length) * 100);
    }
  }

  function handleCell(x: number, y: number) {
    const existing = placements.find((placement) => placement.x === x && placement.y === y);
    if (existing) {
      // Tapping a placed optic picks it back up.
      setPlacements(placements.filter((placement) => placement !== existing));
      return;
    }
    if (!activePiece || !canPlace(level, x, y)) return;
    if ((remaining.get(activePiece) ?? 0) <= 0) return;
    setPlacements([...placements, { x, y, kind: activePiece }]);
  }

  function selectLevel(index: number) {
    setLevelIndex(index);
    setSelected(null);
  }

  return (
    <GameFrame
      id="light-loom"
      title="Light Loom"
      intro="Place prisms and mirrors so the lamp colours every target. Prisms split white light: red travels straight on, green turns left, blue turns right (Lazors-style optics, original layouts)."
    >
      <Card className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Levels">
          {LEVELS.map((entry, index) => (
            <Button
              key={entry.name}
              variant={index === levelIndex ? "default" : "outline"}
              onClick={() => selectLevel(index)}
              aria-pressed={index === levelIndex}
            >
              {index + 1}. {entry.name}
              {solved[index] ? " ✓" : ""}
            </Button>
          ))}
        </div>

        <SegmentedControl
          label="Optic"
          value={activePiece ?? trayOptions[0]?.id ?? "prism"}
          options={trayOptions}
          onChange={(id) => setSelected(id)}
        />

        <div
          className="board grid-texture mx-auto grid grid-cols-6 gap-1.5 p-3"
          style={{ width: "min(92vw, 420px)" }}
          role="group"
          aria-label={`${level.name}. ${litTargets.length} of ${totalTargets} targets lit.`}
        >
          {composed.grid.map((row, y) =>
            row.map((cell, x) => {
              const colors = lit.get(`${x},${y}`) ?? new Set<string>();
              const isTarget = cell.kind === "target";
              const targetHit = isTarget && cell.needs && colors.has(cell.needs);
              const placed = placements.some((p) => p.x === x && p.y === y);
              const free = canPlace(level, x, y);
              const interactive = free || placed;
              const glyph =
                cell.kind === "emitter"
                  ? "☀"
                  : cell.kind === "prism"
                    ? PIECE_GLYPH.prism
                    : cell.kind === "mirrorA"
                      ? PIECE_GLYPH.mirrorA
                      : cell.kind === "mirrorB"
                        ? PIECE_GLYPH.mirrorB
                        : isTarget
                          ? (cell.needs ?? "").toUpperCase()
                          : colors.size > 0
                            ? [...colors].join("")
                            : "";
              const tone =
                cell.kind === "wall"
                  ? "bg-[var(--foreground)]/80"
                  : isTarget
                    ? targetHit
                      ? "bg-emerald-400 text-emerald-950"
                      : "bg-[var(--secondary)] border-2 border-rose-400"
                    : cell.kind === "emitter"
                      ? "bg-amber-300 text-amber-950"
                      : placed
                        ? "bg-violet-300 text-violet-950 ring-2 ring-violet-500/60"
                        : colors.size > 0
                          ? "bg-indigo-300/70 text-indigo-950"
                          : "bg-[var(--secondary)]";
              const action = placed ? "remove" : free && activePiece ? "place" : "";
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  disabled={!interactive}
                  onClick={() => handleCell(x, y)}
                  aria-label={`Column ${x + 1}, row ${y + 1}: ${cellLabel(cell)}${
                    colors.size ? `, lit ${[...colors].join(" ")}` : ""
                  }${action ? `. Activate to ${action}` : ""}`}
                  className={`flex h-11 items-center justify-center rounded-md text-xs font-bold transition-colors ${tone} ${
                    interactive
                      ? "cursor-pointer hover:brightness-95"
                      : "cursor-default disabled:opacity-100"
                  }`}
                >
                  <span aria-hidden="true">{glyph}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="stat-pill">
            Targets lit <strong className="tabular-nums">{litTargets.length}</strong> /{" "}
            {totalTargets}
          </span>
          <span className="stat-pill">
            Optics left{" "}
            <strong className="tabular-nums">
              {Math.max(0, level.tray.length - placements.length)}
            </strong>
          </span>
          <span className="stat-pill">
            Solved <strong className="tabular-nums">{Object.keys(solved).length}</strong> /{" "}
            {LEVELS.length}
          </span>
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          R = red (straight through a prism), G = green (turns left), B = blue (turns right). Select
          an optic, then activate a free square. Activating a placed optic picks it up again.
        </p>

        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => setPlacements([])}
            disabled={placements.length === 0}
          >
            Clear optics
          </Button>
        </div>

        {solvedNow && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">
              Every target coloured · {Object.keys(solved).length} / {LEVELS.length} levels
            </p>
            {levelIndex + 1 < LEVELS.length && (
              <div className="mt-2 flex justify-center">
                <Button variant="outline" onClick={() => selectLevel(levelIndex + 1)}>
                  Next layout
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Colouring every target">
        <ExampleStep n={1}>
          Level 1 ships one mirror <code>\</code>. The lamp fires east along the top row, so drop it
          on the last square of that row (column 6, row 1): <code>\</code> turns an eastbound beam
          south, straight down to the target.
        </ExampleStep>
        <ExampleStep n={2}>
          Level 2 ships one prism. Put it in the lamp&apos;s path at column 3, row 1: red carries
          straight on to the red target on the right, blue bends south onto the blue target. One
          piece, two targets.
        </ExampleStep>
        <ExampleStep n={3}>
          Stuck? Work backwards from each target to the lamp — a mirror only bends a beam a quarter
          turn, so a target that is neither in the lamp&apos;s row nor its column needs two bends.
        </ExampleStep>
        <ExampleResult>
          Each solved layout is worth 25 points — all four levels make 100.
        </ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
