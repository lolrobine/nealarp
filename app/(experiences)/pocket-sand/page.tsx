"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { SegmentedControl } from "@/lib/components/ui/segmented-control";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { EMPTY, GOALS, H, makeGrid, SAND, sandScore, set, step, WALL, W, WATER } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

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
  const brushRef = useRef({ x: 24, y: 16 });
  const [running, setRunning] = useState(!reducedMotion);
  const [speedId, setSpeedId] = useLocalStorage<string>(
    "nealarp:settings:v1:pocket-sand:speed",
    "normal"
  );
  const [material, setMaterial] = useLocalStorage<number>(
    "nealarp:settings:v1:pocket-sand:material",
    SAND
  );
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
    // Keyboard brush marker (visible whenever the canvas is focused).
    if (document.activeElement === canvas) {
      const b = brushRef.current;
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x * cell + 1, b.y * cell + 1, cell - 2, cell - 2);
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
    paintCell(x, y);
  }

  function paintCell(x: number, y: number) {
    brushRef.current = { x: Math.max(0, Math.min(W - 1, x)), y: Math.max(0, Math.min(H - 1, y)) };
    set(gridRef.current, brushRef.current.x, brushRef.current.y, material);
    draw();
    setScore(sandScore(gridRef.current, goal));
  }

  // Keyboard parity: arrow keys move a brush cursor, Enter/Space paints, Delete clears.
  function onCanvasKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const { x, y } = brushRef.current;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      brushRef.current = {
        x: Math.max(0, Math.min(W - 1, x + move[0])),
        y: Math.max(0, Math.min(H - 1, y + move[1])),
      };
      draw();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      paintCell(x, y);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      set(gridRef.current, x, y, EMPTY);
      draw();
      setScore(sandScore(gridRef.current, goal));
    }
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

        <div className="flex flex-wrap items-center justify-center gap-3">
          <SegmentedControl
            label="Tool"
            value={String(material)}
            options={MATERIALS.map((m) => ({ id: String(m.id), label: m.label }))}
            onChange={(id) => setMaterial(Number(id))}
          />
          <SegmentedControl
            label="Pace"
            value={speedId}
            options={SPEEDS.map((s) => ({ id: s.id, label: s.label }))}
            onChange={setSpeedId}
          />
          <Button onClick={() => setRunning(!running)} aria-pressed={running}>
            {running ? "Pause" : "Play"}
          </Button>
        </div>

        <canvas
          ref={canvasRef}
          width={W * 10}
          height={H * 10}
          className="board mx-auto w-full touch-none"
          style={{ maxWidth: 640, imageRendering: "pixelated", cursor: "crosshair" }}
          aria-label="Sand canvas. Drag to pour the selected material, or focus this canvas and use the arrow keys to move the brush, Enter to pour, Delete to clear a cell."
          role="img"
          tabIndex={0}
          onKeyDown={onCanvasKeyDown}
          onFocus={() => draw()}
          onBlur={() => draw()}
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

      <HowToBeat summary="Sculpting a goal shape">
        <ExampleStep n={1}>
          Pour sand slightly <em>above</em> the outline and let it settle — sand piles into clean
          cones you can shave into shape.
        </ExampleStep>
        <ExampleStep n={2}>
          Water levels itself flat — use it for Shoreline and to push piles sideways. Walls hold any
          silhouette in place.
        </ExampleStep>
        <ExampleResult>
          Score = coverage × 0.7 + precision × 0.3 — fill the goal, keep strays out for ~100 on each
          of the six shapes.
        </ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
