"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { makeBoard, place, PLACEMENTS, scoreRun, SIZE, tileSequence, type Tile } from "./logic";

const TILE_EMOJI: Record<string, string> = {
  house: "🏠",
  park: "🌳",
  shop: "🏪",
  factory: "🏭",
  pond: "💧",
};

export default function TinyTownTacticsPage() {
  const record = usePersonalBest("tiny-town-tactics");
  const [seed] = useState(() => `town-${Date.now()}`);
  const sequence = useMemo(() => tileSequence(seed), [seed]);
  const [board, setBoard] = useState<Tile[]>(() => makeBoard());
  const [placedCount, setPlacedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [lastGain, setLastGain] = useState(0);

  const currentTile = sequence[placedCount];
  const finished = placedCount >= PLACEMENTS;

  function handlePlace(x: number, y: number) {
    if (finished || !currentTile) return;
    const result = place(board, x, y, currentTile);
    if (result.gained === 0 && board[y * SIZE + x] !== null) return;
    setBoard(result.board);
    setTotal(total + result.gained);
    setLastGain(result.gained);
    const nextCount = placedCount + 1;
    setPlacedCount(nextCount);
    if (nextCount >= PLACEMENTS) record.save(scoreRun(total + result.gained));
  }

  return (
    <GameFrame
      id="tiny-town-tactics"
      title="Tiny Town Tactics"
      intro="Lay sixteen tiles on the meadow and score through neighbourhood bonuses — a compact placement puzzle in the spirit of ISLANDERS (The Station). The scoring sheet below is complete."
    >
      <Card className="p-6 space-y-4">
        <div className="text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Tile {Math.min(placedCount + 1, PLACEMENTS)} of {PLACEMENTS}
          </p>
          {!finished && currentTile && (
            <p className="text-2xl" aria-live="polite">
              {TILE_EMOJI[currentTile]} <strong className="capitalize">{currentTile}</strong> — pick
              a free cell
            </p>
          )}
          <p className="text-lg font-bold" aria-live="polite">
            Score: {total}
            {lastGain > 0 ? ` (+${lastGain})` : lastGain < 0 ? ` (${lastGain})` : ""}
          </p>
        </div>

        <div
          className="mx-auto grid gap-1"
          style={{ width: "min(92vw, 420px)", gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
          role="grid"
          aria-label="Town board"
        >
          {board.map((tile, i) => {
            const x = i % SIZE;
            const y = Math.floor(i / SIZE);
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                disabled={finished || tile !== null}
                onClick={() => handlePlace(x, y)}
                aria-label={`Cell ${x + 1},${y + 1}: ${tile ?? "empty"}`}
                className={`flex aspect-square items-center justify-center rounded-md border text-lg ${
                  tile
                    ? "border-[var(--border)] bg-[var(--secondary)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-amber-400"
                }`}
              >
                {tile ? TILE_EMOJI[tile] : ""}
              </button>
            );
          })}
        </div>

        <details className="rounded-lg border border-[var(--border)] p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Scoring sheet</summary>
          <ul className="mt-2 list-disc pl-5 text-[var(--muted-foreground)]">
            <li>Every tile: +1 base.</li>
            <li>House: +3 per park or pond, +1 per shop, −2 per factory.</li>
            <li>Park: +2 per house or pond, −1 per factory.</li>
            <li>Shop: +2 per house, +1 per shop.</li>
            <li>Factory: +4 per factory, −1 per house or park.</li>
            <li>Pond: +2 per park, +1 per pond, −1 per factory.</li>
          </ul>
        </details>

        {finished && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">
              Town complete · {total} points · {scoreRun(total)} / 100
            </p>
            <Button
              className="mt-2"
              onClick={() => {
                setBoard(makeBoard());
                setPlacedCount(0);
                setTotal(0);
                setLastGain(0);
              }}
            >
              Build again
            </Button>
          </div>
        )}
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
