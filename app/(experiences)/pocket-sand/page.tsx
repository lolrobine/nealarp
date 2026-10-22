"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { ChoiceStrip } from "@/lib/components/games/ChoiceStrip";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { SegmentedControl } from "@/lib/components/ui/segmented-control";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import {
  EMPTY,
  GOALS,
  H,
  makeGrid,
  OIL,
  SAND,
  sandScore,
  step,
  WALL,
  W,
  WATER,
  stamp,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const SPEEDS = [
  { id: "slow", label: "Practice pace", ticksPerSecond: 4 },
  { id: "normal", label: "Normal", ticksPerSecond: 12 },
  { id: "fast", label: "Fast", ticksPerSecond: 30 },
];
const MATERIALS = [
  { id: SAND, label: "Sand" },
  { id: WATER, label: "Water" },
  { id: OIL, label: "Oil" },
  { id: WALL, label: "Wall" },
  { id: EMPTY, label: "Eraser" },
];

const BRUSHES = [
  { id: "0", label: "Fine" },
  { id: "1", label: "Medium" },
  { id: "2", label: "Wide" },
];

export default function PocketSandPage() {
  const record = usePersonalBest("pocket-sand");
  const reducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<Uint8Array>(makeGrid());
  const brushRef = useRef({ x: 24, y: 16 });
  const radiusRef = useRef(1);
  const phaseRef = useRef(0);
  // Drives the deterministic sideways-flow hash, so water does not band.
  const tickRef = useRef(0);
  const [running, setRunning] = useState(!reducedMotion);
  const [speedId, setSpeedId] = useLocalStorage<string>(
    "nealarp:settings:v1:pocket-sand:speed",
    "normal"
  );
  const [brushId, setBrushId] = useLocalStorage<string>(
    "nealarp:settings:v1:pocket-sand:brush",
    "1"
  );
  const [material, setMaterial] = useLocalStorage<number>(
    "nealarp:settings:v1:pocket-sand:material",
    SAND
  );
  const [goalIndex, setGoalIndex] = useState(0);
  const [score, setScore] = useState(0);
  const goal = GOALS[goalIndex] ?? GOALS[0]!;

  const radius = Number(BRUSHES.find((b) => b.id === brushId)?.id ?? 1);

  radiusRef.current = radius;

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
        if (mat === OIL) {
          // An oil slick: dark body, iridescent skin on the surface cell so the
          // layer stays readable where it floats on top of the water.
          const skin = y === 0 || grid[(y - 1) * W + x] === EMPTY;
          ctx.fillStyle = skin
            ? `hsl(${276 + Math.sin(x * 0.5 + phaseRef.current) * 14} 70% 62%)`
            : "#4c1d95";
        } else if (mat === WATER) {
          // The topmost water cell of a column is the surface: it catches the light,
          // and ripples slowly while the simulation runs. The waterline stays visible
          // even when still, so the hint is never animation-only.
          const surface = y === 0 || grid[(y - 1) * W + x] === EMPTY;
          ctx.fillStyle = surface
            ? `hsl(199 94% ${70 + Math.sin(x * 0.6 + phaseRef.current) * 9}%)`
            : "#38bdf8";
        } else {
          ctx.fillStyle = mat === SAND ? "#fbbf24" : "#94a3b8";
        }
        ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
      }
    }
    // Keyboard brush marker (visible whenever the canvas is focused).
    if (document.activeElement === canvas) {
      const b = brushRef.current;
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2;
      const span = (radiusRef.current * 2 + 1) * cell;
      ctx.strokeRect(
        (b.x - radiusRef.current) * cell + 1,
        (b.y - radiusRef.current) * cell + 1,
        span - 2,
        span - 2
      );
    }
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    const speed = SPEEDS.find((s) => s.id === speedId)?.ticksPerSecond ?? 12;
    const interval = setInterval(() => {
      gridRef.current = step(gridRef.current, tickRef.current++);
      if (!reducedMotion) phaseRef.current += 0.3;
      draw();
      setScore(sandScore(gridRef.current, goal));
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [running, speedId, goal, draw, reducedMotion]);

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
    stamp(gridRef.current, brushRef.current.x, brushRef.current.y, material, radius);
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
      stamp(gridRef.current, x, y, EMPTY, radius);
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
        <ChoiceStrip label="Goals">
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
        </ChoiceStrip>
        <p className="text-sm text-[var(--muted-foreground)]">{goal.hint}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <SegmentedControl
            label="Tool"
            value={String(material)}
            options={MATERIALS.map((m) => ({ id: String(m.id), label: m.label }))}
            onChange={(id) => setMaterial(Number(id))}
          />
          <SegmentedControl
            label="Brush"
            value={brushId}
            options={BRUSHES.map((b) => ({ id: b.id, label: b.label }))}
            onChange={setBrushId}
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
