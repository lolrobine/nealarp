"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { BestPill, SegmentedControl } from "@/lib/components/games/SettingsRow";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { EMPTY, GOALS, H, makeGrid, SAND, sandScore, set, step, WALL, W, WATER } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const SPEEDS = [
  { id: "slow", label: "Chill", ticksPerSecond: 4 },
  { id: "normal", label: "Normal", ticksPerSecond: 12 },
  { id: "fast", label: "Fast", ticksPerSecond: 30 },
];
const MATERIALS = [
  { id: SAND, label: "Sand", swatch: "#fbbf24" },
  { id: WATER, label: "Water", swatch: "#38bdf8" },
  { id: WALL, label: "Wall", swatch: "#94a3b8" },
  { id: EMPTY, label: "Erase", swatch: "#0f172a" },
];
const BRUSHES = [
  { id: "1", label: "Fine", size: 0 },
  { id: "2", label: "Brush", size: 1 },
  { id: "3", label: "Pour", size: 2 },
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
  const [brushId, setBrushId] = useLocalStorage<string>(
    "nealarp:settings:v1:pocket-sand:brush",
    "2"
  );
  const brush = BRUSHES.find((b) => b.id === brushId) ?? BRUSHES[1]!;
  const [goalIndex, setGoalIndex] = useState(0);
  const [score, setScore] = useState(0);
  const goal = GOALS[goalIndex] ?? GOALS[0]!;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const cell = canvas.width / W;
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // subtle grid backdrop
    ctx.fillStyle = "rgba(148,163,184,0.04)";
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    const grid = gridRef.current;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const mat = grid[y * W + x]!;
        if (mat === 0) continue;
        if (mat === SAND) {
          // Sand: grainy warm shades
          const jitter = ((x * 13 + y * 7) % 5) - 2;
          const g = 185 + jitter * 3;
          ctx.fillStyle = `rgb(245,${g},${60 + jitter * 4})`;
        } else if (mat === WATER) {
          // Water: banded blues to hint at surface height
          const below = y + 1 < H ? grid[(y + 1) * W + x] : 0;
          const surface = below === EMPTY;
          ctx.fillStyle = surface ? "#7dd3fc" : (x + y) % 2 === 0 ? "#38bdf8" : "#0ea5e9";
        } else {
          ctx.fillStyle = "#94a3b8";
        }
        ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
      }
    }
    // Keyboard brush marker (visible whenever the canvas is focused).
    const b = brushRef.current;
    const r = brush.size;
    if (document.activeElement === canvas) {
      ctx.strokeStyle = "rgba(248,250,252,0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        (b.x - r) * cell + 1,
        (b.y - r) * cell + 1,
        (r * 2 + 1) * cell - 2,
        (r * 2 + 1) * cell - 2
      );
    }
  }, [brush.size]);

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
    const cx = Math.max(0, Math.min(W - 1, x));
    const cy = Math.max(0, Math.min(H - 1, y));
    brushRef.current = { x: cx, y: cy };
    const r = brush.size;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + 1) continue;
        // Circular brush, soft edge for larger sizes
        if (r > 0 && dx * dx + dy * dy === r * r + 1 && Math.random() < 0.5) continue;
        set(gridRef.current, cx + dx, cy + dy, material);
      }
    }
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
            label="Material"
            value={String(material)}
            onChange={(v) => setMaterial(Number(v))}
            options={MATERIALS.map((m) => ({
              value: String(m.id),
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ background: m.swatch }}
                  />
                  {m.label}
                </span>
              ),
            }))}
          />
          <SegmentedControl
            label="Brush size"
            value={brushId}
            onChange={setBrushId}
            options={BRUSHES.map((b) => ({ value: b.id, label: b.label }))}
          />
          <SegmentedControl
            label="Sim speed"
            value={speedId}
            onChange={setSpeedId}
            options={SPEEDS.map((s) => ({ value: s.id, label: s.label }))}
          />
          <Button
            size="sm"
            variant={running ? "outline" : "default"}
            onClick={() => setRunning(!running)}
            aria-pressed={running}
          >
            {running ? "⏸ Pause" : "▶ Play"}
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

        <div className="flex flex-wrap items-center justify-center gap-3">
          <p className="stat-pill text-base">
            Score&nbsp;<strong className="tabular-nums">{score}</strong> / 100
          </p>
          <BestPill best={record.best} />
          <Button
            onClick={() => {
              record.save(score);
            }}
            disabled={score === 0}
            size="sm"
          >
            Save this sculpt
          </Button>
          <Button
            variant="outline"
            size="sm"
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
