"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import {
  initialSlide,
  isWin,
  parseRoom,
  roomScore,
  ROOMS,
  rotate,
  type Ball,
  type Cell,
  type Move,
  type TiltState,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const COLUMNS = ["A", "B", "C", "D", "E", "F"];

/** Gravity never moves — the room does. Turning the room clockwise on screen
 * therefore walks gravity the other way round the room, which the rules call a
 * "ccw" move. Getting this backwards would show marbles falling upwards. */
const MOVE_FOR_SCREEN: Record<"cw" | "ccw", Move> = { cw: "ccw", ccw: "cw" };

const CANVAS = 460;
/** A square has to shrink by √2 to keep its corners inside while it spins. */
const ROOM = CANVAS / Math.SQRT2;
const DEG_PER_SECOND = 150;

function cellName(x: number, y: number): string {
  return `${COLUMNS[x] ?? "?"}${y + 1}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type PaintArgs = {
  cells: Cell[][];
  balls: { id: string; x: number; y: number }[];
  angle: number;
  won: boolean;
};

function paint(ctx: CanvasRenderingContext2D, a: PaintArgs) {
  const rows = a.cells.length || 6;
  const cols = a.cells[0]?.length ?? 6;
  const unit = ROOM / Math.max(rows, cols);

  ctx.clearRect(0, 0, CANVAS, CANVAS);
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS);
  sky.addColorStop(0, "#0b1120");
  sky.addColorStop(1, "#1e293b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS, CANVAS);

  // Gravity marker, drawn unrotated: the reminder that down never changes.
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#94a3b8";
  ctx.fillStyle = "#94a3b8";
  ctx.lineWidth = 2;
  const gx = 26;
  ctx.beginPath();
  ctx.moveTo(gx, CANVAS - 74);
  ctx.lineTo(gx, CANVAS - 38);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gx - 7, CANVAS - 46);
  ctx.lineTo(gx + 7, CANVAS - 46);
  ctx.lineTo(gx, CANVAS - 30);
  ctx.closePath();
  ctx.fill();
  ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("gravity", gx, CANVAS - 16);
  ctx.restore();

  ctx.save();
  ctx.translate(CANVAS / 2, CANVAS / 2);
  ctx.rotate((a.angle * Math.PI) / 180);
  ctx.translate((-cols * unit) / 2, (-rows * unit) / 2);

  // Box shell.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#0f172a";
  roundRect(ctx, -8, -8, cols * unit + 16, rows * unit + 16, 14);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = a.won ? "rgba(250,204,21,0.9)" : "rgba(148,163,184,0.45)";
  ctx.lineWidth = 4;
  roundRect(ctx, -8, -8, cols * unit + 16, rows * unit + 16, 14);
  ctx.stroke();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = a.cells[y]?.[x] ?? "empty";
      const px = x * unit;
      const py = y * unit;
      if (cell === "wall") {
        const face = ctx.createLinearGradient(px, py, px, py + unit);
        face.addColorStop(0, "#475569");
        face.addColorStop(1, "#273449");
        ctx.fillStyle = face;
        roundRect(ctx, px + 1.5, py + 1.5, unit - 3, unit - 3, 5);
        ctx.fill();
        ctx.strokeStyle = "rgba(226,232,240,0.16)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = "rgba(148,163,184,0.07)";
      roundRect(ctx, px + 1.5, py + 1.5, unit - 3, unit - 3, 5);
      ctx.fill();

      if (cell === "sticky") {
        // Hatching, so "sticky" reads without relying on the amber tint.
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, px + 1.5, py + 1.5, unit - 3, unit - 3, 5);
        ctx.clip();
        ctx.fillStyle = "rgba(251,191,36,0.22)";
        ctx.fillRect(px, py, unit, unit);
        ctx.strokeStyle = "rgba(251,191,36,0.75)";
        ctx.lineWidth = 2;
        for (let i = -unit; i < unit; i += 7) {
          ctx.beginPath();
          ctx.moveTo(px + i, py);
          ctx.lineTo(px + i + unit, py + unit);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (cell === "goalA" || cell === "goalB") {
        const isA = cell === "goalA";
        const colour = isA ? "56,189,248" : "251,113,133";
        ctx.save();
        ctx.translate(px + unit / 2, py + unit / 2);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = `rgba(${colour},0.95)`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, unit * 0.33, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(${colour},0.9)`;
        ctx.font = `700 ${Math.round(unit * 0.3)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isA ? "A" : "B", 0, 1);
        ctx.restore();
      }
    }
  }

  for (const ball of a.balls) {
    const isA = ball.id === "A";
    const cx = (ball.x + 0.5) * unit;
    const cy = (ball.y + 0.5) * unit;
    const r = unit * 0.36;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.12, cx, cy, r);
    body.addColorStop(0, isA ? "#bae6fd" : "#fecdd3");
    body.addColorStop(0.55, isA ? "#0ea5e9" : "#f43f5e");
    body.addColorStop(1, isA ? "#075985" : "#9f1239");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.35, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.round(unit * 0.28)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ball.id, cx, cy + unit * 0.01);
  }

  ctx.restore();
}

export default function TwinTiltPage() {
  const record = usePersonalBest("twin-tilt");
  const reducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [roomIndex, setRoomIndex] = useState(0);
  const room = ROOMS[roomIndex] ?? ROOMS[0]!;
  const cells = useMemo(() => parseRoom(room), [room]);
  const [history, setHistory] = useState<TiltState[]>(() => [initialSlide(room)]);
  const [solved, setSolved] = useState<Record<number, number>>({});
  const [spinning, setSpinning] = useState<"cw" | "ccw" | null>(null);

  const state = history[history.length - 1] ?? initialSlide(room);
  const moves = history.length - 1;
  const won = isWin(state, cells);

  /** Absolute on-screen angle of the box, and where it is settling to. */
  const angleRef = useRef(0);
  const restRef = useRef(0);
  /** Where this particular hold began, so the swing is measured from there
   * rather than from a resting angle the animation may not have reached yet. */
  const spinFromRef = useRef(0);
  /** Marbles tween from where they were to where gravity just put them. */
  const slideRef = useRef<{ from: Ball[]; to: Ball[]; start: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
    if (canvas.width !== CANVAS * dpr) {
      canvas.width = CANVAS * dpr;
      canvas.height = CANVAS * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let balls: { id: string; x: number; y: number }[] = state.balls;
    const slide = slideRef.current;
    if (slide && !reducedMotion) {
      const t = Math.min(1, (performance.now() - slide.start) / 260);
      const eased = 1 - Math.pow(1 - t, 3);
      balls = slide.to.map((ball) => {
        const was = slide.from.find((b) => b.id === ball.id) ?? ball;
        return {
          id: ball.id,
          x: was.x + (ball.x - was.x) * eased,
          y: was.y + (ball.y - was.y) * eased,
        };
      });
      if (t >= 1) slideRef.current = null;
    }
    paint(ctx, { cells, balls, angle: angleRef.current, won });
  }, [cells, state.balls, won, reducedMotion]);

  useEffect(() => {
    draw();
  }, [draw]);

  // One animation loop drives both the spin and the settle-back.
  const spinRef = useRef<"cw" | "ccw" | null>(null);
  useEffect(() => {
    spinRef.current = spinning;
  }, [spinning]);

  useEffect(() => {
    if (reducedMotion) {
      angleRef.current = restRef.current;
      draw();
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const held = spinRef.current;
      if (held) {
        angleRef.current += (held === "cw" ? 1 : -1) * DEG_PER_SECOND * dt;
      } else {
        const gap = restRef.current - angleRef.current;
        angleRef.current += Math.abs(gap) < 0.25 ? gap : gap * Math.min(1, dt * 12);
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, draw]);

  const applyQuarters = useCallback(
    (screenDir: "cw" | "ccw", quarters: number) => {
      if (won || quarters < 1) return;
      const move = MOVE_FOR_SCREEN[screenDir];
      const before = state.balls;
      let current = state;
      const added: TiltState[] = [];
      for (let i = 0; i < quarters; i++) {
        current = rotate(current, cells, move);
        added.push(current);
      }
      const nextHistory = [...history, ...added];
      setHistory(nextHistory);
      slideRef.current = { from: before, to: current.balls, start: performance.now() };
      restRef.current += (screenDir === "cw" ? 1 : -1) * 90 * quarters;

      if (!isWin(current, cells)) return;
      const movesUsed = nextHistory.length - 1;
      const nextSolved = { ...solved, [roomIndex]: Math.min(solved[roomIndex] ?? 999, movesUsed) };
      setSolved(nextSolved);
      if (Object.keys(nextSolved).length === ROOMS.length) {
        const total =
          ROOMS.reduce((sum, r, i) => sum + roomScore(nextSolved[i] ?? r.par, r.par), 0) /
          ROOMS.length;
        record.save(Math.round(total * 10) / 10);
      }
    },
    [won, state, cells, history, solved, roomIndex, record]
  );

  const startSpin = useCallback(
    (dir: "cw" | "ccw") => {
      if (won) return;
      if (reducedMotion) {
        applyQuarters(dir, 1);
        return;
      }
      setSpinning((current) => {
        if (current) return current;
        spinFromRef.current = angleRef.current;
        return dir;
      });
    },
    [won, reducedMotion, applyQuarters]
  );

  const endSpin = useCallback(() => {
    const held = spinRef.current;
    if (!held) return;
    setSpinning(null);
    // How far the box actually swung during this hold. A quick tap travels no
    // distance at all and counts as one quarter, so the control still works as
    // a plain button.
    const travelled = Math.abs(angleRef.current - spinFromRef.current);
    const quarters = Math.max(1, Math.round(travelled / 90));
    applyQuarters(held, quarters);
  }, [applyQuarters]);

  // Keyboard parity: hold an arrow key to spin, release to let it settle.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
        return;
      if (event.key === "z" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
        restRef.current = 0;
        return;
      }
      if (event.repeat) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        startSpin("cw");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        startSpin("ccw");
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") endSpin();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startSpin, endSpin]);

  // A pointer released anywhere must stop the spin, not just on the button.
  useEffect(() => {
    if (!spinning) return;
    const stop = () => endSpin();
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [spinning, endSpin]);

  function selectRoom(index: number) {
    const target = ROOMS[index] ?? ROOMS[0]!;
    setRoomIndex(index);
    setHistory([initialSlide(target)]);
    setSpinning(null);
    restRef.current = 0;
    angleRef.current = 0;
    slideRef.current = null;
  }

  function undo() {
    if (history.length <= 1) return;
    setHistory(history.slice(0, -1));
    restRef.current = 0;
    angleRef.current = 0;
  }

  const ballReport = state.balls.map((b) => `Ball ${b.id} at ${cellName(b.x, b.y)}`).join(", ");

  return (
    <GameFrame
      id="twin-tilt"
      title="Twin Tilt"
      intro="Hold a turn control and the whole room swings round; gravity keeps pointing down, so both marbles roll when you let go. Land ball A and ball B on their own goals at the same time."
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
            className="board overflow-hidden p-0"
            style={{ width: "min(92vw, 440px)" }}
            role="img"
            aria-label={`Room ${room.name}. ${ballReport}.`}
          >
            <canvas
              ref={canvasRef}
              className="block w-full"
              style={{ aspectRatio: "1 / 1" }}
              aria-hidden="true"
            />
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {ballReport}. {moves} moves used.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="stat-pill">
              Moves <strong className="tabular-nums">{moves}</strong> / par {room.par}
            </span>
            <span className="stat-pill">
              Gravity in the room points <strong>{state.gravity}</strong>
            </span>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              onPointerDown={(event) => {
                event.preventDefault();
                startSpin("ccw");
              }}
              onClick={(event) => {
                // Keyboard activation only; pointer presses already spun it.
                if (event.detail === 0) applyQuarters("ccw", 1);
              }}
              disabled={won}
              aria-label="Turn the room counterclockwise. Hold to keep turning."
            >
              Hold to turn ↺
            </Button>
            <Button
              variant="secondary"
              onPointerDown={(event) => {
                event.preventDefault();
                startSpin("cw");
              }}
              onClick={(event) => {
                if (event.detail === 0) applyQuarters("cw", 1);
              }}
              disabled={won}
              aria-label="Turn the room clockwise. Hold to keep turning."
            >
              Hold to turn ↻
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={undo} disabled={history.length <= 1}>
              Undo
            </Button>
            <Button variant="outline" onClick={() => selectRoom(roomIndex)}>
              Reset room
            </Button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Hold a control — or hold ← / → — to swing the room; let go and it settles on the nearest
            quarter turn. A single tap turns exactly one quarter. Ctrl/⌘+Z undoes.
          </p>
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

      <HowToBeat summary="Beating a room in its par">
        <ExampleStep n={1}>
          Read both marbles before turning — one quarter turn moves both, so chase turns that fix
          one ball without stranding the other.
        </ExampleStep>
        <ExampleStep n={2}>
          Every room is BFS-solved: the shown par (2–6 moves) is the true minimum. If you pass par,
          undo (Ctrl/Cmd+Z) and try turning the other way first.
        </ExampleStep>
        <ExampleResult>Each room at par: 100 − 3 × (moves − par) = 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
