"use client";

import { useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  applySlide,
  initialState,
  isWin,
  LEVELS,
  scoreRun,
  slide,
  type Pt,
  type SlideLevel,
  type SlideState,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const DIR_LABELS = ["up", "right", "down", "left"];
const KEY_DIRS: Record<string, number> = {
  ArrowUp: 0,
  ArrowRight: 1,
  ArrowDown: 2,
  ArrowLeft: 3,
  w: 0,
  d: 1,
  s: 2,
  a: 3,
};

const COLS = 6;
const CELL = 74;
const CANVAS = COLS * CELL;
const mid = (n: number) => n * CELL + CELL / 2;

/** Deterministic 0..1 noise so the drifts look hand-shaped but never shift. */
function wobble(seed: number): number {
  const v = Math.sin(seed * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

/** A soft closed curve. Overlapping blobs merge into one drift, unlike tiles. */
function blobPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, seed: number) {
  const n = 10;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.84 + wobble(seed * 7.3 + i * 3.1) * 0.3);
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.94 });
  }
  const first = pts[0]!;
  const last = pts[n - 1]!;
  ctx.beginPath();
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  for (let i = 0; i < n; i += 1) {
    const cur = pts[i]!;
    const nxt = pts[(i + 1) % n]!;
    ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2);
  }
  ctx.closePath();
}

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(angle - 0.42) * size, y - Math.sin(angle - 0.42) * size);
  ctx.lineTo(x - Math.cos(angle + 0.42) * size, y - Math.sin(angle + 0.42) * size);
  ctx.closePath();
  ctx.fill();
}

function paintIce(
  ctx: CanvasRenderingContext2D,
  level: SlideLevel,
  state: SlideState,
  postman: Pt,
  won: boolean
) {
  ctx.clearRect(0, 0, CANVAS, CANVAS);

  // --- the sheet itself: one unbroken surface, no cells ---------------------
  ctx.fillStyle = "#13314d";
  ctx.fillRect(0, 0, CANVAS, CANVAS);
  const sheen = ctx.createLinearGradient(0, 0, CANVAS, CANVAS);
  sheen.addColorStop(0, "rgba(186, 230, 253, 0.26)");
  sheen.addColorStop(0.45, "rgba(125, 190, 232, 0.08)");
  sheen.addColorStop(1, "rgba(8, 26, 44, 0.42)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, CANVAS, CANVAS);

  // hairline cracks, fixed by seed
  ctx.strokeStyle = "rgba(226, 245, 255, 0.13)";
  ctx.lineWidth = 1;
  for (let c = 0; c < 7; c += 1) {
    let x = wobble(c * 3.7) * CANVAS;
    let y = wobble(c * 9.1) * CANVAS;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let seg = 0; seg < 5; seg += 1) {
      x += (wobble(c * 5 + seg) - 0.5) * 150;
      y += (wobble(c * 11 + seg) - 0.5) * 150;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // frost specks at the cell centres: enough to count distance, far from a grid
  ctx.fillStyle = "rgba(224, 246, 255, 0.17)";
  for (let y = 0; y < COLS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      ctx.beginPath();
      ctx.arc(mid(x), mid(y), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- the postman's round, as a dotted beat ---------------------------------
  ctx.save();
  ctx.setLineDash([5, 7]);
  ctx.strokeStyle = "rgba(251, 113, 133, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  level.patrol.forEach((p, i) => {
    if (i === 0) ctx.moveTo(mid(p.x), mid(p.y));
    else ctx.lineTo(mid(p.x), mid(p.y));
  });
  ctx.stroke();
  ctx.restore();
  level.patrol.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(mid(p.x), mid(p.y), 4, 0, Math.PI * 2);
    ctx.fillStyle = i === state.pi ? "rgba(251, 113, 133, 0.9)" : "rgba(251, 113, 133, 0.35)";
    ctx.fill();
  });

  // --- snow drifts where the walls are --------------------------------------
  level.rows.forEach((row, y) => {
    row.split("").forEach((cell, x) => {
      if (cell !== "#") return;
      const seed = x * 31 + y * 17 + 1;
      ctx.fillStyle = "rgba(6, 20, 36, 0.55)";
      blobPath(ctx, mid(x) + 3, mid(y) + 6, CELL * 0.56, seed);
      ctx.fill();
      const rock = ctx.createLinearGradient(
        mid(x),
        mid(y) - CELL * 0.5,
        mid(x),
        mid(y) + CELL * 0.5
      );
      rock.addColorStop(0, "#dbeafe");
      rock.addColorStop(0.5, "#93b3cd");
      rock.addColorStop(1, "#4d6a85");
      ctx.fillStyle = rock;
      blobPath(ctx, mid(x), mid(y), CELL * 0.55, seed);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      blobPath(ctx, mid(x) - 2, mid(y) - CELL * 0.14, CELL * 0.4, seed + 4);
      ctx.fill();
    });
  });

  // --- the postbox ------------------------------------------------------------
  const gx = mid(level.goal.x);
  const gy = mid(level.goal.y);
  ctx.fillStyle = "rgba(4, 47, 36, 0.45)";
  ctx.beginPath();
  ctx.ellipse(gx, gy + CELL * 0.3, CELL * 0.3, CELL * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#34d399";
  ctx.beginPath();
  ctx.roundRect(gx - CELL * 0.22, gy - CELL * 0.26, CELL * 0.44, CELL * 0.52, [
    CELL * 0.2,
    CELL * 0.2,
    4,
    4,
  ]);
  ctx.fill();
  ctx.fillStyle = "#064e3b";
  ctx.fillRect(gx - CELL * 0.13, gy - CELL * 0.11, CELL * 0.26, 5);
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(gx + CELL * 0.22, gy - CELL * 0.2);
  ctx.lineTo(gx + CELL * 0.34, gy - CELL * 0.2);
  ctx.stroke();

  // --- where each slide would end up ------------------------------------------
  if (!won) {
    const px = mid(state.x);
    const py = mid(state.y);
    [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].forEach(([dx, dy], dir) => {
      const [lx, ly] = slide(level, state, dir);
      if (lx === state.x && ly === state.y) return;
      const tx = mid(lx);
      const ty = mid(ly);
      const angle = Math.atan2(dy ?? 0, dx ?? 0);
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(186, 230, 253, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + (dx ?? 0) * CELL * 0.34, py + (dy ?? 0) * CELL * 0.34);
      ctx.lineTo(tx - (dx ?? 0) * CELL * 0.3, ty - (dy ?? 0) * CELL * 0.3);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "rgba(186, 230, 253, 0.65)";
      arrowHead(ctx, tx - (dx ?? 0) * CELL * 0.22, ty - (dy ?? 0) * CELL * 0.22, angle, 9);
      ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, CELL * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // --- the postman --------------------------------------------------------------
  const mx = mid(postman.x);
  const my = mid(postman.y);
  ctx.fillStyle = "rgba(4, 12, 24, 0.5)";
  ctx.beginPath();
  ctx.ellipse(mx, my + CELL * 0.28, CELL * 0.22, CELL * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.moveTo(mx, my - CELL * 0.06);
  ctx.lineTo(mx + CELL * 0.17, my + CELL * 0.24);
  ctx.lineTo(mx - CELL * 0.17, my + CELL * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx, my - CELL * 0.15, CELL * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = "#ffe4e6";
  ctx.fill();
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.arc(mx, my - CELL * 0.17, CELL * 0.12, Math.PI, Math.PI * 2);
  ctx.fill();

  // --- the parcel you are pushing ---------------------------------------------
  const sx = mid(state.x);
  const sy = mid(state.y);
  ctx.fillStyle = "rgba(4, 12, 24, 0.45)";
  ctx.beginPath();
  ctx.ellipse(sx, sy + CELL * 0.27, CELL * 0.24, CELL * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  const box = ctx.createLinearGradient(sx, sy - CELL * 0.25, sx, sy + CELL * 0.25);
  box.addColorStop(0, "#7dd3fc");
  box.addColorStop(1, "#0284c7");
  ctx.fillStyle = box;
  ctx.beginPath();
  ctx.roundRect(sx - CELL * 0.24, sy - CELL * 0.24, CELL * 0.48, CELL * 0.48, 9);
  ctx.fill();
  ctx.strokeStyle = "#fef3c7";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx, sy - CELL * 0.24);
  ctx.lineTo(sx, sy + CELL * 0.24);
  ctx.moveTo(sx - CELL * 0.24, sy);
  ctx.lineTo(sx + CELL * 0.24, sy);
  ctx.stroke();
}

export default function IcePostPage() {
  const record = usePersonalBest("ice-post");
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex] ?? LEVELS[0]!;
  const [history, setHistory] = useState<SlideState[]>(() => [initialState(level)]);
  const [solved, setSolved] = useState<Record<number, number>>({});

  const state = history[history.length - 1] ?? initialState(level);
  const moves = history.length - 1;
  const won = isWin(level, state);
  const postman = level.patrol[state.pi] ?? level.patrol[0]!;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    paintIce(ctx, level, state, postman, won);
  }, [level, state, postman, won]);

  // Keyboard parity with the slide buttons.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const dir = KEY_DIRS[event.key];
      if (dir === undefined) return;
      event.preventDefault();
      doSlide(dir);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function selectLevel(index: number) {
    const target = LEVELS[index] ?? LEVELS[0]!;
    setLevelIndex(index);
    setHistory([initialState(target)]);
  }

  function doSlide(dir: number) {
    if (won) return;
    const next = applySlide(level, state, dir);
    if (next === state) return;
    const nextHistory = [...history, next];
    setHistory(nextHistory);
    if (isWin(level, next)) {
      const movesUsed = nextHistory.length - 1;
      const nextSolved = {
        ...solved,
        [levelIndex]: Math.min(solved[levelIndex] ?? 999, movesUsed),
      };
      setSolved(nextSolved);
      if (Object.keys(nextSolved).length === LEVELS.length) {
        const total =
          LEVELS.reduce((sum, l, i) => sum + scoreRun(nextSolved[i] ?? l.par, l.par), 0) /
          LEVELS.length;
        record.save(Math.round(total * 10) / 10);
      }
    }
  }

  return (
    <GameFrame
      id="ice-post"
      title="Ice Post"
      intro="Slide until something stops you: walls, edges, or the postman on his round. He moves one step after every slide — deliver to the green postbox."
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
              {solved[i] !== undefined ? " ✓" : ""}
            </Button>
          ))}
        </div>

        <div className="board mx-auto p-3" style={{ width: "min(92vw, 444px)" }}>
          <canvas
            ref={canvasRef}
            width={CANVAS}
            height={CANVAS}
            className="block h-auto w-full rounded-lg"
            role="img"
            aria-label={`You are at ${state.x + 1},${state.y + 1}. Postman at ${postman.x + 1},${postman.y + 1}. Postbox at ${level.goal.x + 1},${level.goal.y + 1}.`}
          />
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          The dashed rings show where each slide would leave you. Use the buttons or the arrow keys.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DIR_LABELS.map((label, dir) => (
            <Button key={label} variant="secondary" disabled={won} onClick={() => doSlide(dir)}>
              Slide {label}
            </Button>
          ))}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Moves: <strong>{moves}</strong> / par {level.par} · Postman step {state.pi + 1} of{" "}
          {level.patrol.length}
        </p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setHistory(history.slice(0, -1))}
            disabled={history.length <= 1}
          >
            Undo
          </Button>
          <Button variant="outline" onClick={() => selectLevel(levelIndex)}>
            Reset
          </Button>
        </div>

        {won && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">
              Delivered in {moves} move{moves === 1 ? "" : "s"} · {scoreRun(moves, level.par)} / 100
            </p>
            {levelIndex + 1 < LEVELS.length && (
              <Button className="mt-2" onClick={() => selectLevel(levelIndex + 1)}>
                Next round
              </Button>
            )}
          </div>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="A par delivery round">
        <ExampleStep n={1}>
          You slide until something stops you — aim at the <em>end square</em>, not the path. Walls
          and edges are your brakes.
        </ExampleStep>
        <ExampleStep n={2}>
          The postman steps once after each of your slides. Count his round while you plan: pars run
          3–7 slides and are BFS-minimums.
        </ExampleStep>
        <ExampleResult>Deliver at par on all ten rounds for the full score.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
