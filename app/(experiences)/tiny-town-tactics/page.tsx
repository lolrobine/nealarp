"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  makeBoard,
  place,
  placementScore,
  PLACEMENTS,
  scoreRun,
  SIZE,
  tileSequence,
  type Tile,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const TILE_COLOUR: Record<string, string> = {
  house: "#f59e0b",
  park: "#22c55e",
  shop: "#a855f7",
  factory: "#64748b",
  pond: "#38bdf8",
};

/** Drawn tiles, not emoji: each kind has its own silhouette, so the board is
 *  readable in greyscale and at thumbnail size. */
function TileGlyph({ kind, size = 26 }: { kind: string; size?: number }) {
  const colour = TILE_COLOUR[kind] ?? "#94a3b8";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      {kind === "house" && (
        <>
          <path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" fill={colour} />
          <rect x="10" y="14" width="4" height="6" fill="rgba(0,0,0,0.35)" />
        </>
      )}
      {kind === "park" && (
        <>
          <rect x="11" y="15" width="2" height="6" fill="#78350f" />
          <path d="M12 3 19 15H5Z" fill={colour} />
          <path d="M12 7.5 17 15H7Z" fill="rgba(255,255,255,0.22)" />
        </>
      )}
      {kind === "shop" && (
        <>
          <rect x="4" y="10" width="16" height="11" rx="1" fill={colour} />
          <path d="M3 10 5 5h14l2 5Z" fill="rgba(255,255,255,0.35)" />
          <rect x="9" y="14" width="6" height="7" fill="rgba(0,0,0,0.35)" />
        </>
      )}
      {kind === "factory" && (
        <>
          <path d="M3 21V12l6 3V12l6 3V8h6v13Z" fill={colour} />
          <rect x="16" y="3" width="3" height="6" fill={colour} />
          <circle cx="17.5" cy="2" r="2" fill="rgba(255,255,255,0.3)" />
        </>
      )}
      {kind === "pond" && (
        <>
          <ellipse cx="12" cy="14" rx="9" ry="6" fill={colour} />
          <ellipse cx="9" cy="12" rx="3" ry="1.6" fill="rgba(255,255,255,0.45)" />
        </>
      )}
    </svg>
  );
}

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
            <p
              className="flex items-center justify-center gap-2 text-xl"
              aria-live="polite"
              aria-label={`Place a ${currentTile}. Each free cell shows what it would score.`}
            >
              <TileGlyph kind={currentTile} size={30} />
              <strong className="capitalize">{currentTile}</strong>
              <span className="text-sm text-[var(--muted-foreground)]">
                — the numbers show what it scores there
              </span>
            </p>
          )}
          <p className="text-lg font-bold" aria-live="polite">
            Score: {total}
            {lastGain > 0 ? ` (+${lastGain})` : lastGain < 0 ? ` (${lastGain})` : ""}
          </p>
        </div>

        <div
          className="board mx-auto grid gap-1.5 p-3"
          style={{ width: "min(92vw, 420px)", gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
          role="grid"
          aria-label="Town board"
        >
          {board.map((tile, i) => {
            const x = i % SIZE;
            const y = Math.floor(i / SIZE);
            // What this cell would be worth right now — the whole scoring sheet,
            // shown where the decision is made instead of hidden in a details tag.
            const preview =
              tile || finished || !currentTile ? null : placementScore(board, x, y, currentTile);
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                disabled={finished || tile !== null}
                onClick={() => handlePlace(x, y)}
                aria-label={
                  tile
                    ? `Cell ${x + 1},${y + 1}: ${tile}`
                    : preview === null
                      ? `Cell ${x + 1},${y + 1}: empty`
                      : `Cell ${x + 1},${y + 1}: empty, placing ${currentTile} here scores ${
                          preview > 0 ? "plus " : "minus "
                        }${Math.abs(preview)}`
                }
                className={`flex aspect-square items-center justify-center rounded-md border text-sm font-bold tabular-nums ${
                  tile
                    ? "border-[var(--border)] bg-[var(--secondary)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-amber-400"
                } ${
                  preview === null
                    ? ""
                    : preview >= 6
                      ? "text-emerald-500"
                      : preview >= 1
                        ? "text-[var(--muted-foreground)]"
                        : "text-rose-500"
                }`}
              >
                {tile ? (
                  <TileGlyph kind={tile} />
                ) : preview === null ? (
                  ""
                ) : (
                  <span>
                    {preview > 0 ? "+" : ""}
                    {preview}
                  </span>
                )}
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
          <WinScreen
            headline={`Town complete · ${total} points`}
            score={scoreRun(total)}
            detail={`${PLACEMENTS} tiles laid.`}
          >
            <Button
              onClick={() => {
                setBoard(makeBoard());
                setPlacedCount(0);
                setTotal(0);
                setLastGain(0);
              }}
            >
              Build again
            </Button>
          </WinScreen>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Building to 320">
        <ExampleStep n={1}>
          Cluster by adjacency: houses score next to parks, shops next to factories. The full
          scoring sheet sits under the board — every bonus is listed.
        </ExampleStep>
        <ExampleStep n={2}>
          Sixteen placements on an 8×8 meadow. Build tight neighbourhoods first, then fill the edges
          — scattered tiles waste adjacency bonuses.
        </ExampleStep>
        <ExampleResult>Total 320 points → score = total / 320 × 100 = 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
