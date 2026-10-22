"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  applyHop,
  hopTarget,
  initialState,
  isWin,
  LEVELS,
  scoreRun,
  type HexLevel,
  type HexState,
  type Hop,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const DIR_LABELS = ["E", "W", "NW", "NE", "SW", "SE"];

// Pointy-top hexagons on an odd-row offset grid: odd rows sit half a hex to the
// right, which is exactly the neighbourhood stepHex() encodes.
const R = 38;
const HEX_W = Math.sqrt(3) * R;
const HEX_H = 2 * R;
const ROW_STEP = 1.5 * R;
const PAD = 8;
const BOARD_W = Math.round(5.5 * HEX_W + PAD * 2);
const BOARD_H = Math.round(ROW_STEP * 4 + HEX_H + PAD * 2);

function hexCentre(x: number, y: number): { cx: number; cy: number } {
  return {
    cx: PAD + HEX_W / 2 + x * HEX_W + (y % 2 ? HEX_W / 2 : 0),
    cy: PAD + R + y * ROW_STEP,
  };
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 90);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function noise(seed: number): number {
  const v = Math.sin(seed * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

function paintField(
  ctx: CanvasRenderingContext2D,
  level: HexLevel,
  state: HexState,
  reachable: ReadonlyMap<string, Hop>,
  won: boolean
) {
  ctx.clearRect(0, 0, BOARD_W, BOARD_H);

  // molten floor under everything
  ctx.fillStyle = "#1c0a06";
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  for (let i = 0; i < 24; i += 1) {
    const x = noise(i * 3.1) * BOARD_W;
    const y = noise(i * 7.7) * BOARD_H;
    const r = 24 + noise(i * 5.3) * 46;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, "rgba(249, 115, 22, 0.32)");
    glow.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  level.rows.forEach((row, y) => {
    row.split("").forEach((cell, x) => {
      const { cx, cy } = hexCentre(x, y);
      const gone = state.gone.includes(`${x},${y}`);
      const solid = cell === "#" && !gone;
      const isPawn = state.x === x && state.y === y;
      const isGoal = level.goal.x === x && level.goal.y === y;
      const canHop = reachable.has(`${x},${y}`);

      if (!solid) {
        // a hole in the chain: lava, with the broken rim left behind
        hexPath(ctx, cx, cy, R - 2);
        const lava = ctx.createRadialGradient(cx, cy, 2, cx, cy, R);
        lava.addColorStop(0, gone ? "#fed7aa" : "#fdba74");
        lava.addColorStop(0.5, "#ea580c");
        lava.addColorStop(1, "#7c2d12");
        ctx.fillStyle = lava;
        ctx.fill();
        if (gone) {
          ctx.strokeStyle = "rgba(68, 24, 12, 0.85)";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.strokeStyle = "rgba(30, 10, 6, 0.6)";
          ctx.lineWidth = 2;
          for (let c = 0; c < 3; c += 1) {
            const a = noise(x * 9 + y * 5 + c) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8);
            ctx.stroke();
          }
        }
        return;
      }

      // a standing slab of cooled basalt
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      hexPath(ctx, cx, cy, R - 2);
      const rock = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
      if (isGoal) {
        rock.addColorStop(0, "#6ee7b7");
        rock.addColorStop(1, "#047857");
      } else {
        rock.addColorStop(0, "#57534e");
        rock.addColorStop(1, "#292524");
      }
      ctx.fillStyle = rock;
      ctx.fill();
      ctx.restore();

      // top bevel so the slab reads as a solid object
      ctx.strokeStyle = isGoal ? "rgba(209, 250, 229, 0.8)" : "rgba(214, 211, 209, 0.35)";
      ctx.lineWidth = 2;
      hexPath(ctx, cx, cy, R - 3);
      ctx.stroke();

      if (isGoal) {
        ctx.strokeStyle = "rgba(240, 253, 244, 0.95)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(240, 253, 244, 0.95)";
        ctx.fill();
      }

      if (canHop && !won) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 4;
        hexPath(ctx, cx, cy, R - 6);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(251, 191, 36, 0.16)";
        hexPath(ctx, cx, cy, R - 6);
        ctx.fill();
      }

      if (isPawn) {
        ctx.save();
        ctx.shadowColor = "rgba(251, 191, 36, 0.9)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#fbbf24";
        hexPath(ctx, cx, cy, R * 0.46);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#451a03";
        hexPath(ctx, cx, cy, R * 0.22);
        ctx.fill();
      }
    });
  });
}

export default function LavaLinksPage() {
  const record = usePersonalBest("lava-links");
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex] ?? LEVELS[0]!;
  const [history, setHistory] = useState<HexState[]>(() => [initialState(level)]);
  const [solved, setSolved] = useState<Record<number, number>>({});

  const state = history[history.length - 1] ?? initialState(level);
  const moves = history.length - 1;
  const won = isWin(level, state);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /** Every tile you could legally land on, with the cheapest hop that gets there. */
  const reachable = useMemo(() => {
    const found = new Map<string, Hop>();
    if (won) return found;
    for (const dir of [0, 1, 2, 3, 4, 5]) {
      for (const steps of [1, 2] as const) {
        const target = hopTarget(level, state, { dir, steps });
        if (!target) continue;
        const key = `${target[0]},${target[1]}`;
        if (!found.has(key)) found.set(key, { dir, steps });
      }
    }
    return found;
  }, [level, state, won]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    paintField(ctx, level, state, reachable, won);
  }, [level, state, reachable, won]);

  function selectLevel(index: number) {
    const target = LEVELS[index] ?? LEVELS[0]!;
    setLevelIndex(index);
    setHistory([initialState(target)]);
  }

  function doHop(hop: Hop) {
    if (won) return;
    const next = applyHop(level, state, hop);
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
      id="lava-links"
      title="Lava Links"
      intro="Hop one or two tiles across the hex chain. The tile you leave crumbles into lava — plan every landing."
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

        <div className="board relative mx-auto p-3" style={{ width: `min(92vw, ${BOARD_W}px)` }}>
          <canvas
            ref={canvasRef}
            width={BOARD_W}
            height={BOARD_H}
            aria-hidden="true"
            className="block h-auto w-full"
          />
          <div
            className="absolute inset-3"
            role="group"
            aria-label={`${level.name}. You are at ${state.x + 1},${state.y + 1}. Goal at ${level.goal.x + 1},${level.goal.y + 1}.`}
          >
            {level.rows.map((row, y) =>
              row.split("").map((cell, x) => {
                const gone = state.gone.includes(`${x},${y}`);
                const isPawn = state.x === x && state.y === y;
                const isGoal = level.goal.x === x && level.goal.y === y;
                const hop = reachable.get(`${x},${y}`);
                const { cx, cy } = hexCentre(x, y);
                const what = gone ? "crumbled" : cell === "#" ? "slab" : "lava";
                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    disabled={!hop || won}
                    onClick={() => hop && doHop(hop)}
                    aria-label={`${x + 1},${y + 1} ${what}${isGoal ? " goal" : ""}${
                      isPawn ? " you are here" : ""
                    }${hop ? ` (hop ${hop.steps} ${DIR_LABELS[hop.dir]} to land here)` : ""}`}
                    className="absolute rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-default"
                    style={{
                      left: `${((cx - HEX_W / 2) / BOARD_W) * 100}%`,
                      top: `${((cy - R * 0.86) / BOARD_H) * 100}%`,
                      width: `${(HEX_W / BOARD_W) * 100}%`,
                      height: `${((R * 1.72) / BOARD_H) * 100}%`,
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Tap a <strong className="text-amber-500">glowing slab</strong> to hop onto it. On a
          keyboard, Tab steps through only the legal landings — press Enter to jump.
        </p>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Moves: <strong>{moves}</strong> / par {level.par}
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
          <WinScreen
            headline={`Crossed in ${moves} move${moves === 1 ? "" : "s"}`}
            score={scoreRun(moves, level.par)}
            detail={`Par for this crossing is ${level.par}.`}
          >
            {levelIndex + 1 < LEVELS.length && (
              <Button onClick={() => selectLevel(levelIndex + 1)}>Next level</Button>
            )}
          </WinScreen>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Clearing a level at par">
        <ExampleStep n={1}>
          Hop one or two tiles along the chain; the tile you leave crumbles. Plan the LAST landing
          first — every early hop removes a future option.
        </ExampleStep>
        <ExampleStep n={2}>
          Each level is BFS-solved at its par (2–5 hops). Over par? Restart and try the other first
          hop — the crumbling rule makes first moves decisive.
        </ExampleStep>
        <ExampleResult>All seven levels at par — scoreRun keeps the full 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
