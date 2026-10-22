"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { SegmentedControl } from "@/lib/components/ui/segmented-control";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import {
  canPlace,
  isSolved,
  LEVELS,
  SIZE,
  traceBeams,
  withPlacements,
  type Level,
  type PieceKind,
  type Placement,
  type Segment,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const PIECE_LABEL: Record<PieceKind, string> = {
  prism: "Prism",
  mirrorA: "Mirror /",
  mirrorB: "Mirror \\",
};

/** Beam colours as raw channels, so the canvas can blend them additively:
 * red and green crossing really do add up to yellow on screen. */
const BEAM_RGB: Record<string, [number, number, number]> = {
  r: [248, 113, 113],
  g: [74, 222, 128],
  b: [96, 165, 250],
};

/** Logical drawing size. The element itself scales to its CSS box. */
const CANVAS = 480;

function cellLabel(cell: Level["grid"][0][0]): string {
  if (!cell) return "empty";
  if (cell.kind === "wall") return "wall";
  if (cell.kind === "emitter") return "lamp";
  if (cell.kind === "prism") return "prism";
  if (cell.kind === "mirrorA") return "mirror /";
  if (cell.kind === "mirrorB") return "mirror \\";
  if (cell.kind === "target") return `target needing ${cell.needs}`;
  return "empty";
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
  board: Level;
  segments: Segment[];
  lit: Map<string, Set<string>>;
  phase: number;
  ghost: { x: number; y: number } | null;
};

/** Draws the whole board. Kept outside the component so it stays a pure
 * function of its arguments and can be reasoned about on its own. */
function paint(ctx: CanvasRenderingContext2D, a: PaintArgs) {
  const unit = CANVAS / SIZE;
  const mid = (n: number) => (n + 0.5) * unit;

  const backdrop = ctx.createLinearGradient(0, 0, 0, CANVAS);
  backdrop.addColorStop(0, "#0a1120");
  backdrop.addColorStop(1, "#131d33");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, CANVAS, CANVAS);

  ctx.strokeStyle = "rgba(148,163,184,0.10)";
  ctx.lineWidth = 1;
  for (let i = 1; i < SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * unit, 0);
    ctx.lineTo(i * unit, CANVAS);
    ctx.moveTo(0, i * unit);
    ctx.lineTo(CANVAS, i * unit);
    ctx.stroke();
  }

  // --- walls -------------------------------------------------------------
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (a.board.grid[y]?.[x]?.kind !== "wall") continue;
      const px = x * unit + 3;
      const py = y * unit + 3;
      const size = unit - 6;
      const face = ctx.createLinearGradient(px, py, px, py + size);
      face.addColorStop(0, "#334155");
      face.addColorStop(1, "#1e293b");
      ctx.fillStyle = face;
      roundRect(ctx, px, py, size, size, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(226,232,240,0.14)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // --- the light itself --------------------------------------------------
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const s of a.segments) {
    const [r, g, b] = BEAM_RGB[s.color] ?? [255, 255, 255];
    const x1 = mid(s.x1);
    const y1 = mid(s.y1);
    let x2 = mid(s.x2);
    let y2 = mid(s.y2);
    // Light stops at a wall rather than painting over it.
    if (a.board.grid[s.y2]?.[s.x2]?.kind === "wall") {
      x2 = x1 + (x2 - x1) * 0.46;
      y2 = y1 + (y2 - y1) * 0.46;
    }
    const pulse = 0.72 + Math.sin(a.phase + (s.x1 + s.y1) * 0.8) * 0.1;
    const stroke = (width: number, alpha: number, colour: string) => {
      ctx.strokeStyle = colour;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    stroke(unit * 0.5, 0.1, `rgb(${r},${g},${b})`); // outer haze
    stroke(unit * 0.22, 0.26, `rgb(${r},${g},${b})`); // glow
    stroke(unit * 0.1, pulse, `rgb(${r},${g},${b})`); // core
    stroke(unit * 0.035, pulse * 0.6, "#ffffff"); // hot centre
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // --- fixtures and optics ----------------------------------------------
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = a.board.grid[y]?.[x];
      if (!cell) continue;
      const cx = mid(x);
      const cy = mid(y);

      if (cell.kind === "target") {
        const [r, g, b] = BEAM_RGB[cell.needs ?? "r"] ?? [248, 113, 113];
        const hit = !!cell.needs && !!a.lit.get(`${x},${y}`)?.has(cell.needs);
        const radius = unit * 0.3;
        if (hit) {
          const halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.1);
          halo.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
          halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = halo;
          ctx.fillRect(x * unit - unit, y * unit - unit, unit * 3, unit * 3);
        }
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = hit ? `rgba(${r},${g},${b},0.92)` : "rgba(15,23,42,0.75)";
        ctx.fill();
        ctx.lineWidth = hit ? 3 : 2.5;
        ctx.strokeStyle = `rgba(${r},${g},${b},${hit ? 1 : 0.7})`;
        ctx.stroke();
        // A filled centre dot marks a hit, so the state is never colour-only.
        if (hit) {
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 0.34, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
          ctx.stroke();
        }
      }

      if (cell.kind === "emitter") {
        const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, unit * 0.95);
        glow.addColorStop(0, "rgba(253,224,71,0.55)");
        glow.addColorStop(1, "rgba(253,224,71,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(x * unit - unit, y * unit - unit, unit * 3, unit * 3);
        // Barrel pointing the way the lamp fires.
        const dir = cell.dir ?? 1;
        const vx = dir === 1 ? 1 : dir === 3 ? -1 : 0;
        const vy = dir === 2 ? 1 : dir === 0 ? -1 : 0;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = "#facc15";
        roundRect(ctx, -unit * 0.17, -unit * 0.17, unit * 0.34, unit * 0.34, unit * 0.08);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(vx * unit * 0.16 - vy * unit * 0.13, vy * unit * 0.16 + vx * unit * 0.13);
        ctx.lineTo(vx * unit * 0.16 + vy * unit * 0.13, vy * unit * 0.16 - vx * unit * 0.13);
        ctx.lineTo(vx * unit * 0.36, vy * unit * 0.36);
        ctx.closePath();
        ctx.fillStyle = "#fde68a";
        ctx.fill();
        ctx.restore();
      }

      if (cell.kind === "mirrorA" || cell.kind === "mirrorB") {
        const slope = cell.kind === "mirrorA" ? -1 : 1;
        const reach = unit * 0.32;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.lineCap = "round";
        const sheen = ctx.createLinearGradient(-reach, -reach * slope, reach, reach * slope);
        sheen.addColorStop(0, "#cbd5e1");
        sheen.addColorStop(0.5, "#f8fafc");
        sheen.addColorStop(1, "#94a3b8");
        ctx.strokeStyle = "rgba(15,23,42,0.6)";
        ctx.lineWidth = unit * 0.2;
        ctx.beginPath();
        ctx.moveTo(-reach, -reach * slope);
        ctx.lineTo(reach, reach * slope);
        ctx.stroke();
        ctx.strokeStyle = sheen;
        ctx.lineWidth = unit * 0.12;
        ctx.beginPath();
        ctx.moveTo(-reach, -reach * slope);
        ctx.lineTo(reach, reach * slope);
        ctx.stroke();
        ctx.restore();
      }

      if (cell.kind === "prism") {
        const reach = unit * 0.34;
        ctx.save();
        ctx.translate(cx, cy + reach * 0.18);
        ctx.beginPath();
        ctx.moveTo(0, -reach);
        ctx.lineTo(reach * 0.92, reach * 0.66);
        ctx.lineTo(-reach * 0.92, reach * 0.66);
        ctx.closePath();
        const glass = ctx.createLinearGradient(-reach, -reach, reach, reach);
        glass.addColorStop(0, "rgba(248,113,113,0.85)");
        glass.addColorStop(0.5, "rgba(226,232,240,0.9)");
        glass.addColorStop(1, "rgba(96,165,250,0.85)");
        ctx.fillStyle = glass;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(248,250,252,0.85)";
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // --- drop preview ------------------------------------------------------
  if (a.ghost) {
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "rgba(125,211,252,0.95)";
    ctx.lineWidth = 2.5;
    roundRect(ctx, a.ghost.x * unit + 4, a.ghost.y * unit + 4, unit - 8, unit - 8, 8);
    ctx.stroke();
    ctx.restore();
  }
}

export default function LightLoomPage() {
  const record = usePersonalBest("light-loom");
  const reducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef(0);

  const [levelIndex, setLevelIndex] = useState(0);
  const [solved, setSolved] = useState<Record<number, boolean>>({});
  const [placementsByLevel, setPlacementsByLevel] = useState<Record<number, Placement[]>>({});
  const [selected, setSelected] = useState<PieceKind | null>(null);
  /** The optic currently under the pointer. `at` is null while it hovers a
   * square it cannot land on, which also drives the "release to return" hint. */
  const [drag, setDrag] = useState<{ kind: PieceKind; at: { x: number; y: number } | null } | null>(
    null
  );

  const level = LEVELS[levelIndex] ?? LEVELS[0]!;
  const placements = useMemo(
    () => placementsByLevel[levelIndex] ?? [],
    [placementsByLevel, levelIndex]
  );

  // What the board looks like right now, including the optic being dragged.
  const shown = useMemo(
    () =>
      drag?.at ? [...placements, { x: drag.at.x, y: drag.at.y, kind: drag.kind }] : placements,
    [placements, drag]
  );
  const composed = useMemo(() => withPlacements(level, shown), [level, shown]);
  const { lit, litTargets, segments } = useMemo(() => traceBeams(composed), [composed]);
  const solvedNow = useMemo(() => isSolved(composed), [composed]);

  const remaining = useMemo(() => {
    const counts = new Map<PieceKind, number>();
    for (const kind of level.tray) counts.set(kind, (counts.get(kind) ?? 0) + 1);
    for (const placement of shown) {
      counts.set(placement.kind, (counts.get(placement.kind) ?? 0) - 1);
    }
    return counts;
  }, [level.tray, shown]);

  const trayOptions = useMemo(() => {
    const kinds = [...new Set(level.tray)];
    return kinds.map((kind) => ({
      id: kind,
      label: PIECE_LABEL[kind],
      hint: `${Math.max(0, remaining.get(kind) ?? 0)} left`,
      disabled: (remaining.get(kind) ?? 0) <= 0,
    }));
  }, [level.tray, remaining]);

  const activePiece =
    selected && (remaining.get(selected) ?? 0) > 0
      ? selected
      : (trayOptions.find((option) => !option.disabled)?.id ?? null);

  const totalTargets = level.grid
    .flat()
    .filter((cell) => cell.kind === "target" && cell.needs).length;

  const commit = useCallback(
    (next: Placement[]) => {
      setPlacementsByLevel((prev) => ({ ...prev, [levelIndex]: next }));
      if (!isSolved(withPlacements(level, next))) return;
      setSolved((prev) => {
        if (prev[levelIndex]) return prev;
        const nextSolved = { ...prev, [levelIndex]: true };
        record.save((Object.keys(nextSolved).length / LEVELS.length) * 100);
        return nextSolved;
      });
    },
    [level, levelIndex, record]
  );

  // Refs so the window-level drag listeners stay stable and never read stale
  // state. Synced in an effect rather than during render, which React forbids.
  const placementsRef = useRef(placements);
  const levelRef = useRef(level);
  const dragRef = useRef(drag);
  const commitRef = useRef(commit);
  useEffect(() => {
    placementsRef.current = placements;
    levelRef.current = level;
    dragRef.current = drag;
    commitRef.current = commit;
  });

  const cellFromPoint = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const x = Math.floor(((clientX - rect.left) / rect.width) * SIZE);
    const y = Math.floor(((clientY - rect.top) / rect.height) * SIZE);
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
    return { x, y };
  }, []);

  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    const move = (event: PointerEvent) => {
      const cell = cellFromPoint(event.clientX, event.clientY);
      const free =
        cell &&
        canPlace(levelRef.current, cell.x, cell.y) &&
        !placementsRef.current.some((p) => p.x === cell.x && p.y === cell.y);
      setDrag((current) => (current ? { ...current, at: free ? cell : null } : current));
    };
    const finish = () => {
      const held = dragRef.current;
      if (held?.at) {
        commitRef.current([
          ...placementsRef.current,
          { x: held.at.x, y: held.at.y, kind: held.kind },
        ]);
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [dragging, cellFromPoint]);

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
    paint(ctx, {
      board: composed,
      segments,
      lit,
      phase: phaseRef.current,
      ghost: drag?.at ?? null,
    });
  }, [composed, segments, lit, drag]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Gentle shimmer along the beams. Reduced motion pins it to a still frame.
  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const tick = () => {
      phaseRef.current += 0.05;
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, draw]);

  /** Keyboard and assistive-tech path: one press does the whole place/pick-up. */
  function handleCell(x: number, y: number) {
    const existing = placements.find((placement) => placement.x === x && placement.y === y);
    if (existing) {
      commit(placements.filter((placement) => placement !== existing));
      return;
    }
    if (!activePiece || !canPlace(level, x, y)) return;
    if ((remaining.get(activePiece) ?? 0) <= 0) return;
    commit([...placements, { x, y, kind: activePiece }]);
  }

  function startDrag(x: number, y: number, event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const existing = placements.find((placement) => placement.x === x && placement.y === y);
    if (existing) {
      // Lift it off the board; it rides the pointer until release.
      setPlacementsByLevel((prev) => ({
        ...prev,
        [levelIndex]: placements.filter((placement) => placement !== existing),
      }));
      setDrag({ kind: existing.kind, at: { x, y } });
      return;
    }
    if (!activePiece || !canPlace(level, x, y)) return;
    if ((remaining.get(activePiece) ?? 0) <= 0) return;
    setDrag({ kind: activePiece, at: { x, y } });
  }

  function selectLevel(index: number) {
    setLevelIndex(index);
    setSelected(null);
    setDrag(null);
  }

  return (
    <GameFrame
      id="light-loom"
      title="Light Loom"
      intro="Drag prisms and mirrors onto the grid so the lamp colours every target. Prisms split white light: red travels straight on, green turns left, blue turns right (Lazors-style optics, original layouts)."
    >
      <Card className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Levels">
          {LEVELS.map((entry, index) => (
            <Button
              key={entry.name}
              variant={index === levelIndex ? "default" : "outline"}
              onClick={() => selectLevel(index)}
              aria-pressed={index === levelIndex}
            >
              {index + 1}. {entry.name}
              {solved[index] ? " ✓" : ""}
            </Button>
          ))}
        </div>

        <SegmentedControl
          label="Optic"
          value={activePiece ?? trayOptions[0]?.id ?? "prism"}
          options={trayOptions}
          onChange={(id) => setSelected(id)}
        />

        <div className="board mx-auto p-3" style={{ width: "min(92vw, 440px)" }}>
          <div ref={boardRef} className="relative touch-none select-none">
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="block w-full rounded-lg"
              style={{ aspectRatio: "1 / 1" }}
            />
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
              role="group"
              aria-label={`${level.name}. ${litTargets.length} of ${totalTargets} targets lit.`}
            >
              {composed.grid.map((row, y) =>
                row.map((cell, x) => {
                  const colors = lit.get(`${x},${y}`) ?? new Set<string>();
                  const placed = shown.some((p) => p.x === x && p.y === y);
                  const free = canPlace(level, x, y);
                  const interactive = free || placed;
                  const action = placed ? "remove" : free && activePiece ? "place" : "";
                  return (
                    <button
                      key={`${x}-${y}`}
                      type="button"
                      disabled={!interactive}
                      // Pointer presses start a drag; `detail === 0` means the
                      // press came from the keyboard, which places in one go.
                      onClick={(event) => {
                        if (event.detail === 0) handleCell(x, y);
                      }}
                      onPointerDown={(event) => startDrag(x, y, event)}
                      aria-label={`Column ${x + 1}, row ${y + 1}: ${cellLabel(cell)}${
                        colors.size ? `, lit ${[...colors].join(" ")}` : ""
                      }${action ? `. Activate to ${action}` : ""}`}
                      className={`m-0.5 rounded-md border-2 border-transparent bg-transparent transition-colors focus-visible:border-sky-300 ${
                        interactive ? "cursor-pointer hover:border-sky-300/40" : "cursor-default"
                      }`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="stat-pill">
            Targets lit <strong className="tabular-nums">{litTargets.length}</strong> /{" "}
            {totalTargets}
          </span>
          <span className="stat-pill">
            Optics left{" "}
            <strong className="tabular-nums">
              {Math.max(0, level.tray.length - shown.length)}
            </strong>
          </span>
          <span className="stat-pill">
            Solved <strong className="tabular-nums">{Object.keys(solved).length}</strong> /{" "}
            {LEVELS.length}
          </span>
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Red runs straight through a prism, green turns left, blue turns right. Pick an optic, then
          drag it onto a free square — the light redraws as you move. Dragging a placed optic lifts
          it again. With the keyboard: Tab to a square and press Enter to place or pick up.
        </p>

        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => commit([])} disabled={placements.length === 0}>
            Clear optics
          </Button>
        </div>

        {solvedNow && (
          <WinScreen
            headline="Every target coloured"
            detail={`${Object.keys(solved).length} / ${LEVELS.length} levels solved`}
          >
            {levelIndex + 1 < LEVELS.length && (
              <Button variant="outline" onClick={() => selectLevel(levelIndex + 1)}>
                Next layout
              </Button>
            )}
          </WinScreen>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Colouring every target">
        <ExampleStep n={1}>
          Level 1 ships one mirror <code>\</code>. The lamp fires east along the top row, so drop it
          on the last square of that row (column 6, row 1): <code>\</code> turns an eastbound beam
          south, straight down to the target.
        </ExampleStep>
        <ExampleStep n={2}>
          Level 2 ships one prism. Put it in the lamp&apos;s path at column 3, row 1: red carries
          straight on to the red target on the right, blue bends south onto the blue target. One
          piece, two targets.
        </ExampleStep>
        <ExampleStep n={3}>
          Stuck? Work backwards from each target to the lamp — a mirror only bends a beam a quarter
          turn, so a target that is neither in the lamp&apos;s row nor its column needs two bends.
        </ExampleStep>
        <ExampleResult>
          Each solved layout is worth 25 points — all four levels make 100.
        </ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
