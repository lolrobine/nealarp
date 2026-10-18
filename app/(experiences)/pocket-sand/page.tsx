"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { GOALS, H, makeGrid, SAND, sandScore, set, step, WALL, W, WATER } from "./logic";

const SPEEDS = [
  { id: "slow", label: "Practice pace", ticksPerSecond: 4 },
  { id: "normal", label: "Normal", ticksPerSecond: 12 },
  { id: "fast", label: "Fast", ticksPerSecond: 30 },
];
const MATERIALS = [
  { id: SAND, label: "Sand" },
  { id: WATER, label: "Water" },
  { id: WALL, label: "Wall" },
];

export default function PocketSandPage() {
  const record = usePersonalBest("pocket-sand");
  const reducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<Uint8Array>(makeGrid());
  const [running, setRunning] = useState(!reducedMotion);
  const [speedId, setSpeedId] = useState("normal");
  const [material, setMaterial] = useState<number>(SAND);
  const [goalIndex, setGoalIndex] = useState(0);
  const [score, setScore] = useState(0);
  const goal = GOALS[goalIndex] ?? GOALS[0]!;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const cell = canvas.width / W;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grid = gridRef.current;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const mat = grid[y * W + x]!;
        if (mat === 0) continue;
        ctx.fillStyle = mat === SAND ? "#fbbf24" : mat === WATER ? "#38bdf8" : "#94a3b8";
        ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
      }
    }
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    const speed = SPEEDS.find((s) => s.id === speedId)?.ticksPerSecond ?? 12;
    const interval = setInterval(() => {
      gridRef.current = step(gridRef.current);
      draw();
      setScore(sandScore(gridRef.current, goal));
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [running, speedId, goal, draw]);

  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * W);
    const y = Math.floor(((clientY - rect.top) / rect.height) * H);
    set(gridRef.current, x, y, material);
    draw();
    setScore(sandScore(gridRef.current, goal));
  }

  return (
    <GameFrame
      id="pocket-sand"
      title="Pocket Sand"
      intro="A tiny falling-sand sandbox. Sculpt each goal with the pouring tools — sand piles, water spreads, walls hold the shape."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Goals">
          {GOALS.map((g, i) => (
            <Button
              key={g.id}
              variant={i === goalIndex ? "default" : "outline"}
              onClick={() => setGoalIndex(i)}
              aria-pressed={i === goalIndex}
            >
              {g.name}
            </Button>
          ))}
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">{goal.hint}</p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {MATERIALS.map((m) => (
            <Button
              key={m.id}
              variant={material === m.id ? "default" : "outline"}
              onClick={() => setMaterial(m.id)}
              aria-pressed={material === m.id}
            >
              {m.label}
            </Button>
          ))}
          <Button onClick={() => setRunning(!running)} aria-pressed={running}>
            {running ? "Pause" : "Play"}
          </Button>
          {SPEEDS.map((s) => (
            <Button
              key={s.id}
              variant={speedId === s.id ? "default" : "outline"}
              onClick={() => setSpeedId(s.id)}
              aria-pressed={speedId === s.id}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <canvas
          ref={canvasRef}
          width={W * 10}
          height={H * 10}
          className="mx-auto w-full rounded-xl border border-[var(--border)] touch-none"
          style={{ maxWidth: 640, imageRendering: "pixelated", cursor: "crosshair" }}
          aria-label="Sand canvas. Drag to pour the selected material."
          role="img"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            paintAt(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) paintAt(e.clientX, e.clientY);
          }}
        />

        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-lg font-bold" aria-live="polite">
            Score: {score} / 100
          </p>
          <Button
            onClick={() => {
              record.save(score);
            }}
            disabled={score === 0}
          >
            Save this sculpt
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              gridRef.current = makeGrid();
              draw();
              setScore(0);
            }}
          >
            Clear board
          </Button>
        </div>
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
