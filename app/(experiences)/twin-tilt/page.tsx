"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  initialSlide,
  isWin,
  parseRoom,
  roomScore,
  ROOMS,
  rotate,
  type Move,
  type TiltState,
} from "./logic";

const COLUMNS = ["A", "B", "C", "D", "E", "F"];

function cellName(x: number, y: number): string {
  return `${COLUMNS[x] ?? "?"}${y + 1}`;
}

export default function TwinTiltPage() {
  const record = usePersonalBest("twin-tilt");
  const [roomIndex, setRoomIndex] = useState(0);
  const room = ROOMS[roomIndex] ?? ROOMS[0]!;
  const cells = useMemo(() => parseRoom(room), [room]);
  const [history, setHistory] = useState<TiltState[]>(() => [initialSlide(room)]);
  const [solved, setSolved] = useState<Record<number, number>>({});

  const state = history[history.length - 1] ?? initialSlide(room);
  const moves = history.length - 1;
  const won = isWin(state, cells);

  function selectRoom(index: number) {
    const target = ROOMS[index] ?? ROOMS[0]!;
    setRoomIndex(index);
    setHistory([initialSlide(target)]);
  }

  function doMove(move: Move) {
    if (won) return;
    const next = rotate(state, cells, move);
    const nextHistory = [...history, next];
    setHistory(nextHistory);
    if (isWin(next, cells)) {
      const movesUsed = nextHistory.length - 1;
      const nextSolved = { ...solved, [roomIndex]: Math.min(solved[roomIndex] ?? 999, movesUsed) };
      setSolved(nextSolved);
      if (Object.keys(nextSolved).length === ROOMS.length) {
        const total =
          ROOMS.reduce((sum, r, i) => sum + roomScore(nextSolved[i] ?? r.par, r.par), 0) /
          ROOMS.length;
        record.save(Math.round(total * 10) / 10);
      }
    }
  }

  function undo() {
    if (history.length > 1) setHistory(history.slice(0, -1));
  }

  const preview = (move: Move): string => {
    const next = rotate(state, cells, move);
    return next.balls.map((b) => `${b.id}→${cellName(b.x, b.y)}`).join("  ");
  };

  return (
    <GameFrame
      id="twin-tilt"
      title="Twin Tilt"
      intro="Rotate the room and let gravity slide both marbles. Land ball A and ball B on their own goals at the same time."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Rooms">
          {ROOMS.map((r, i) => (
            <Button
              key={r.name}
              variant={i === roomIndex ? "default" : "outline"}
              onClick={() => selectRoom(i)}
              aria-pressed={i === roomIndex}
            >
              {i + 1}. {r.name}
              {solved[i] !== undefined ? " ✓" : ""}
            </Button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative grid grid-cols-6 gap-1 rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-2"
            style={{ width: "min(92vw, 420px)", aspectRatio: "1 / 1" }}
            role="img"
            aria-label={`Room ${room.name}. ${state.balls.map((b) => `Ball ${b.id} at ${cellName(b.x, b.y)}`).join(", ")}.`}
          >
            {cells.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`rounded-md flex items-center justify-center text-xs font-bold ${
                    cell === "wall"
                      ? "bg-[var(--foreground)]/80"
                      : cell === "sticky"
                        ? "bg-amber-300/70"
                        : cell === "goalA"
                          ? "bg-sky-300/60 border-2 border-sky-500"
                          : cell === "goalB"
                            ? "bg-rose-300/60 border-2 border-rose-500"
                            : "bg-[var(--card)]"
                  }`}
                >
                  {cell === "goalA" ? "A" : cell === "goalB" ? "B" : cell === "sticky" ? "≈" : ""}
                </div>
              ))
            )}
            {state.balls.map((ball) => (
              <div
                key={ball.id}
                aria-hidden="true"
                className={`absolute rounded-full flex items-center justify-center text-xs font-bold text-white shadow ${
                  ball.id === "A" ? "bg-sky-600" : "bg-rose-600"
                }`}
                style={{
                  width: "calc((100% - 40px) / 6 * 0.8)",
                  height: "calc((100% - 40px) / 6 * 0.8)",
                  left: `calc(8px + (100% - 16px) / 6 * ${ball.x} + (100% - 16px) / 6 * 0.1)`,
                  top: `calc(8px + (100% - 16px) / 6 * ${ball.y} + (100% - 16px) / 6 * 0.1)`,
                }}
              >
                {ball.id}
              </div>
            ))}
          </div>

          <p className="text-sm text-[var(--muted-foreground)]">
            Gravity: <strong>{state.gravity}</strong> · Moves: <strong>{moves}</strong> / par{" "}
            {room.par}
          </p>

          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              onClick={() => doMove("cw")}
              disabled={won}
              aria-label="Rotate clockwise"
            >
              Rotate ↻
            </Button>
            <Button
              variant="secondary"
              onClick={() => doMove("ccw")}
              disabled={won}
              aria-label="Rotate counterclockwise"
            >
              Rotate ↺
            </Button>
            <p className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
              ↻ lands: {preview("cw")}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
              ↺ lands: {preview("ccw")}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={undo} disabled={history.length <= 1}>
              Undo
            </Button>
            <Button variant="outline" onClick={() => selectRoom(roomIndex)}>
              Reset room
            </Button>
          </div>
        </div>

        {won && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">
              Room solved in {moves} move{moves === 1 ? "" : "s"} ·{" "}
              {roomScore(moves, room.par).toFixed(0)} / 100
            </p>
            {roomIndex + 1 < ROOMS.length && (
              <Button className="mt-2" onClick={() => selectRoom(roomIndex + 1)}>
                Next room
              </Button>
            )}
            {Object.keys(solved).length === ROOMS.length && (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                All eight rooms solved — run score saved.
              </p>
            )}
          </div>
        )}
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
