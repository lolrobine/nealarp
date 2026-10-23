"use client";
import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  LEVELS,
  rotate,
  occupied,
  canPlace,
  packingScore,
  type Placement,
  type PackingLevel,
} from "./logic";

function PackingBoard({ level, index }: { level: PackingLevel; index: number }) {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [history, setHistory] = useState<Placement[][]>([]);
  const [selected, setSelected] = useState("A");
  const [rotation, setRotation] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("");
  const record = usePersonalBest(`pack-it-perfectly:level-${index}`);
  const cells = occupied(level, placements);
  const complete = cells.size === level.width * level.height;
  const piece = level.pieces.find((p) => p.id === selected)!;
  const preview = rotate(piece.cells, rotation);
  const ghost = new Set(
    hover && !complete ? preview.map(([x, y]) => `${hover.x + x},${hover.y + y}`) : []
  );
  const validGhost = hover
    ? canPlace(level, placements, { id: selected, ...hover, rotation })
    : false;
  const colors: Record<string, string> = {
    A: "#10b981",
    B: "#8b5cf6",
    C: "#0284c7",
    D: "#d97706",
    E: "#db2777",
  };
  function commit(next: Placement[]) {
    setHistory((h) => [...h, placements]);
    setPlacements(next);
    setMoves((m) => m + 1);
  }
  function place(x: number, y: number) {
    if (complete) return;
    const next = { id: selected, x, y, rotation };
    if (!canPlace(level, placements, next)) {
      setMessage(
        "That piece does not fit there. Choose an empty origin, rotate, or remove it first."
      );
      return;
    }
    const all = [...placements, next];
    commit(all);
    setMessage(`Piece ${selected} packed.`);
    const remaining = level.pieces.find((p) => !all.some((v) => v.id === p.id));
    if (remaining) {
      setSelected(remaining.id);
      setRotation(0);
    }
    if (occupied(level, all).size === level.width * level.height) {
      record.save(packingScore(moves + 1, level.pieces.length));
      setMessage("Perfectly packed! Every square is filled.");
    }
  }
  function reset() {
    setPlacements([]);
    setHistory([]);
    setSelected("A");
    setRotation(0);
    setMoves(0);
    setMessage("");
  }
  return (
    <>
      <Card className="p-6 space-y-5">
        <h2 className="text-2xl font-bold">{level.name}</h2>
        <p>
          Select a piece, rotate it if needed, then tap a suitcase cell to place its top-left
          bounding-box corner there. All controls work with Tab and Enter. Fill every cell without
          overlaps. Hover or focus a cell to preview the fit. You can also drag an unpacked piece
          onto the grid.
        </p>
        <div className="flex flex-wrap gap-2">
          {level.pieces.map((p) => (
            <Button
              key={p.id}
              draggable={!complete && !placements.some((v) => v.id === p.id)}
              onDragStart={(e) => {
                setSelected(p.id);
                setRotation(0);
                e.dataTransfer.setData("text/plain", p.id);
              }}
              variant={p.id === selected ? "default" : "secondary"}
              aria-pressed={p.id === selected}
              onClick={() => {
                setSelected(p.id);
                setRotation(0);
              }}
            >
              Piece {p.id}
              {placements.some((v) => v.id === p.id) ? " · packed" : ""}
            </Button>
          ))}
        </div>
        <div>
          <p>
            Selected piece {selected} · rotation {rotation * 90}°
          </p>
          <svg
            viewBox="0 0 160 100"
            className="h-24 w-40"
            role="img"
            aria-label={`Piece ${selected} preview at ${rotation * 90} degrees`}
          >
            {preview.map(([x, y]) => (
              <rect
                key={`${x},${y}`}
                x={x * 24 + 4}
                y={y * 24 + 4}
                width="22"
                height="22"
                fill="var(--primary)"
                stroke="currentColor"
              />
            ))}
          </svg>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            disabled={complete}
            onClick={() => setRotation((r) => (r + 1) % 4)}
          >
            Rotate 90°
          </Button>
          <Button
            variant="secondary"
            disabled={complete || !placements.some((p) => p.id === selected)}
            onClick={() => {
              commit(placements.filter((p) => p.id !== selected));
              setMessage(`Piece ${selected} removed.`);
            }}
          >
            Remove selected piece
          </Button>
          <Button
            variant="secondary"
            disabled={complete || history.length === 0}
            onClick={() => {
              setPlacements(history[history.length - 1]!);
              setHistory((h) => h.slice(0, -1));
              setMoves((m) => m + 1);
              setMessage("Last placement undone.");
            }}
          >
            Undo
          </Button>
        </div>
        <div
          className="grid gap-1 max-w-sm mx-auto"
          style={{ gridTemplateColumns: `repeat(${level.width}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: level.width * level.height }, (_, i) => {
            const x = i % level.width,
              y = Math.floor(i / level.width),
              id = cells.get(`${x},${y}`);
            return (
              <button
                key={i}
                disabled={complete}
                onPointerEnter={() => setHover({ x, y })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ x, y })}
                onBlur={() => setHover(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHover({ x, y });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.getData("text/plain") === selected) place(x, y);
                  setHover(null);
                }}
                style={
                  id
                    ? { background: colors[id] }
                    : ghost.has(`${x},${y}`)
                      ? {
                          background: validGhost ? "#10b98140" : "#ef444440",
                          borderColor: validGhost ? "#10b981" : "#ef4444",
                        }
                      : undefined
                }
                aria-label={`Row ${y + 1}, column ${x + 1}, ${id ? `piece ${id}` : "empty"}`}
                className={`aspect-square rounded border-2 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${id ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--secondary)]"}`}
                onClick={() => place(x, y)}
              >
                {id ?? "·"}
              </button>
            );
          })}
        </div>
        {hover && !complete && (
          <p className="text-sm">
            Placement preview: {validGhost ? "Fits here" : "Does not fit here"} · row {hover.y + 1},
            column {hover.x + 1}
          </p>
        )}
        <p role="status">
          {message}
          {complete && ` Score: ${packingScore(moves, level.pieces.length)} / 100.`}
        </p>
        <p>
          Moves: {moves}. Score: 100 minus 5 for each placement, removal or undo beyond the number
          of pieces. Rotations are free.
        </p>
        <Button variant="secondary" onClick={reset}>
          Restart level
        </Button>
      </Card>
      <PersonalBest record={record} />
    </>
  );
}
export default function PackItPerfectly() {
  const [level, setLevel] = useState(0);
  return (
    <GameFrame
      id="pack-it-perfectly"
      title="Pack It Perfectly"
      intro="A little suitcase. Absolutely no room for wasted space."
    >
      <label>
        Level{" "}
        <select
          aria-label="Level"
          className="ml-3 rounded border p-2 bg-[var(--background)]"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
        >
          {LEVELS.map((l, i) => (
            <option key={l.name} value={i}>
              {i + 1}. {l.name}
            </option>
          ))}
        </select>
      </label>
      <PackingBoard key={level} level={LEVELS[level]!} index={level} />
    </GameFrame>
  );
}
