"use client";
import { useId, useRef, useState, type PointerEvent } from "react";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Slider } from "@/lib/components/ui/slider";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { usePlayback } from "@/lib/hooks/usePlayback";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  GOLF_LEVELS,
  gravityAcceleration,
  simulateFlight,
  golfScore,
  type GolfLevel,
  type Flight,
} from "./logic";
function Course({ level, index }: { level: GolfLevel; index: number }) {
  const gradientId = useId().replace(/:/g, "");
  const [showGravity, setShowGravity] = useState(true);
  const [angle, setAngle] = useState(25);
  const [power, setPower] = useState(150);
  const [shots, setShots] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const record = usePersonalBest(`gravity-golf:level-${index}:gravity-v2`);
  const playback = usePlayback();
  const dragging = useRef(false);
  const shownPath = flight?.path.slice(
    0,
    Math.max(1, Math.ceil(flight.path.length * playback.progress))
  );
  const ball = shownPath?.at(-1) ?? level.start;
  function aim(event: PointerEvent<SVGSVGElement>) {
    if (finished || playback.running) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = ((event.clientX - bounds.left) / bounds.width) * 600 - level.start.x;
    const dy = level.start.y - ((event.clientY - bounds.top) / bounds.height) * 360;
    setAngle(Math.round(Math.min(80, Math.max(0, (Math.atan2(dy, dx) * 180) / Math.PI)) * 2) / 2);
    setPower(Math.round(Math.min(220, Math.max(60, Math.hypot(dx, dy) * 0.5))));
  }
  const won = flight?.outcome === "goal";
  const finished = won || shots >= 8;
  const preview = simulateFlight(level, angle, power).path.slice(0, 16);
  function shoot() {
    if (finished || playback.running) return;
    const next = simulateFlight(level, angle, power);
    setFlight(next);
    playback.play(Math.min(4000, Math.max(800, (next.path.length / 30) * 1000)));
    setShots((s) => s + 1);
    if (next.outcome === "goal") record.save(golfScore(shots + 1));
  }
  const points = (path: { x: number; y: number }[]) =>
    path.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  return (
    <>
      <Card className="p-6 space-y-5">
        <h2 className="text-2xl font-bold">{level.name}</h2>
        <p>
          Aim for the dashed goal ring. Planets attract the ball; touching a planet or wall ends a
          shot. Each attempt starts at the same tee. Eight shots per run. The dotted line reveals
          only the start of your next flight. The stronger pull bends slow shots more sharply; high
          power can escape a planet’s attraction. Drag across the course to aim and set power, then
          launch. The sliders offer the same controls without dragging.
        </p>
        <svg
          viewBox="0 0 600 360"
          className="w-full rounded-xl bg-slate-950 touch-none cursor-crosshair"
          onPointerDown={(e) => {
            if (finished || playback.running) return;
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            aim(e);
          }}
          onPointerMove={(e) => {
            if (dragging.current) aim(e);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          role="img"
          aria-label="Gravity golf course with tee, gravity sources, obstacles, and goal"
        >
          <defs>
            <radialGradient id={gradientId} cx="30%" cy="25%">
              <stop stopColor="#dbeafe" />
              <stop offset=".35" stopColor="#818cf8" />
              <stop offset="1" stopColor="#312e81" />
            </radialGradient>
            {PLANET_SKINS.map((skin, i) => (
              <radialGradient
                key={`body-${i}`}
                id={`${gradientId}-body${i}`}
                cx="32%"
                cy="28%"
                r="78%"
              >
                <stop offset="0" stopColor={skin.core} />
                <stop offset=".45" stopColor={skin.mid} />
                <stop offset="1" stopColor={skin.edge} />
              </radialGradient>
            ))}
            {PLANET_SKINS.map((skin, i) => (
              <radialGradient key={`air-${i}`} id={`${gradientId}-air${i}`}>
                <stop offset=".58" stopColor={skin.air} stopOpacity="0" />
                <stop offset=".84" stopColor={skin.air} stopOpacity=".32" />
                <stop offset="1" stopColor={skin.air} stopOpacity="0" />
              </radialGradient>
            ))}
            <radialGradient id={`${gradientId}-term`} cx="32%" cy="28%" r="86%">
              <stop offset=".42" stopColor="#000000" stopOpacity="0" />
              <stop offset="1" stopColor="#000000" stopOpacity=".62" />
            </radialGradient>
            <radialGradient id={`${gradientId}-ball`} cx="34%" cy="30%" r="76%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".6" stopColor="#e2e8f0" />
              <stop offset="1" stopColor="#64748b" />
            </radialGradient>
            <marker
              id={`${gradientId}-arrow`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10Z" fill="#7dd3fc" />
            </marker>
          </defs>
          {Array.from({ length: 35 }, (_, i) => (
            <circle
              key={`star-${i}`}
              cx={(i * 137 + 21) % 600}
              cy={(i * 71 + 17) % 360}
              r={i % 3 === 0 ? 1.3 : 0.7}
              fill="#cbd5e1"
              opacity=".4"
            />
          ))}
          {showGravity && (
            <g aria-hidden="true" opacity=".45">
              {Array.from({ length: 60 }, (_, i) => {
                const x = 30 + (i % 10) * 60,
                  y = 30 + Math.floor(i / 10) * 60;
                if (level.planets.some((p) => Math.hypot(p.x - x, p.y - y) < p.radius + 15))
                  return null;
                const a = gravityAcceleration(level.planets, { x, y }),
                  strength = Math.hypot(a.x, a.y),
                  length = Math.min(24, Math.max(5, strength * 0.3));
                if (strength === 0) return null;
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={y}
                    x2={x + (a.x / strength) * length}
                    y2={y + (a.y / strength) * length}
                    stroke="#7dd3fc"
                    strokeWidth="1"
                    markerEnd={`url(#${gradientId}-arrow)`}
                  />
                );
              })}
            </g>
          )}
          <g>
            <ellipse
              cx={level.start.x}
              cy={level.start.y + 9}
              rx="15"
              ry="5"
              fill="#0f766e"
              opacity=".55"
            />
            <rect
              x={level.start.x - 2}
              y={level.start.y + 2}
              width="4"
              height="8"
              rx="1.5"
              fill="#94a3b8"
            />
            <text
              x={level.start.x}
              y={level.start.y + 30}
              fill="#cbd5e1"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              letterSpacing="1.5"
            >
              TEE
            </text>
          </g>
          <g>
            <circle
              cx={level.goal.x}
              cy={level.goal.y}
              r="22"
              fill="none"
              stroke="#4ade80"
              strokeWidth="2"
              strokeDasharray="5"
              opacity=".75"
            />
            <ellipse cx={level.goal.x} cy={level.goal.y + 5} rx="14" ry="5" fill="#022c22" />
            <ellipse
              cx={level.goal.x}
              cy={level.goal.y + 3}
              rx="10"
              ry="3.6"
              fill="#052e16"
              stroke="#4ade80"
              strokeWidth="1.5"
            />
            <line
              x1={level.goal.x}
              y1={level.goal.y + 2}
              x2={level.goal.x}
              y2={level.goal.y - 36}
              stroke="#e2e8f0"
              strokeWidth="2"
            />
            <path
              d={`M${level.goal.x} ${level.goal.y - 36} L${level.goal.x + 24} ${level.goal.y - 29} L${level.goal.x} ${level.goal.y - 22} Z`}
              fill="#4ade80"
            />
            <text
              x={level.goal.x}
              y={level.goal.y + 34}
              fill="#86efac"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              letterSpacing="1.5"
            >
              GOAL
            </text>
          </g>
          {level.planets.map((p, i) => {
            const skin = PLANET_SKINS[i % PLANET_SKINS.length]!;
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.radius * 1.6}
                  fill={`url(#${gradientId}-air${i % PLANET_SKINS.length})`}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.radius}
                  fill={`url(#${gradientId}-body${i % PLANET_SKINS.length})`}
                />
                {craters(p, i).map((c, k) => (
                  <circle key={k} cx={c.x} cy={c.y} r={c.r} fill="#000000" opacity=".16" />
                ))}
                <circle cx={p.x} cy={p.y} r={p.radius} fill={`url(#${gradientId}-term)`} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.radius}
                  fill="none"
                  stroke={skin.air}
                  strokeWidth="1.2"
                  opacity=".55"
                />
                {i % 2 === 1 && (
                  <ellipse
                    cx={p.x}
                    cy={p.y}
                    rx={p.radius * 1.5}
                    ry={p.radius * 0.32}
                    fill="none"
                    stroke={skin.core}
                    strokeWidth="2.5"
                    opacity=".5"
                    transform={`rotate(-22 ${p.x} ${p.y})`}
                  />
                )}
              </g>
            );
          })}
          {level.walls.map((w, i) => (
            <rect key={i} {...w} width={w.w} height={w.h} fill="#fbbf24" />
          ))}
          {shownPath && (
            <g>
              <polyline
                points={points(shownPath)}
                fill="none"
                stroke="#fbbf24"
                strokeOpacity=".28"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={points(shownPath)}
                fill="none"
                stroke="#fde68a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
          <g>
            <circle cx={ball.x} cy={ball.y} r="11" fill="#38bdf8" opacity=".18" />
            <circle cx={ball.x} cy={ball.y} r="7" fill={`url(#${gradientId}-ball)`} />
            {DIMPLES.map(([dx, dy], i) => (
              <circle
                key={i}
                cx={ball.x + dx! * 7}
                cy={ball.y + dy! * 7}
                r="1.05"
                fill="#94a3b8"
                opacity=".75"
              />
            ))}
            <circle cx={ball.x - 2.3} cy={ball.y - 2.6} r="1.9" fill="#ffffff" opacity=".95" />
          </g>
          <polyline
            points={points(preview)}
            fill="none"
            stroke="white"
            strokeDasharray="3 5"
            strokeWidth="3"
          />
        </svg>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showGravity}
            onChange={(e) => setShowGravity(e.target.checked)}
          />
          Show gravity field — arrows point toward the combined pull
        </label>
        <p className="text-sm">
          Tee ({level.start.x}, {level.start.y}); goal ({level.goal.x}, {level.goal.y}). Higher
          angles launch more steeply upward. Planet centers:{" "}
          {level.planets.map((p) => `(${p.x}, ${p.y}), radius ${p.radius}`).join("; ")}. Coordinates
          use a 600 × 360 toy world, y downwards.
        </p>
        <Slider
          label="Launch angle"
          valueText={`${angle}°`}
          min={0}
          max={80}
          step={0.5}
          value={angle}
          disabled={finished || playback.running}
          onChange={(e) => setAngle(Number(e.target.value))}
        />
        <Slider
          label="Launch power"
          valueText={String(power)}
          min={60}
          max={220}
          step={1}
          value={power}
          disabled={finished || playback.running}
          onChange={(e) => setPower(Number(e.target.value))}
        />
        <p>Shots used: {shots} / 8</p>
        <div className="flex flex-wrap gap-3">
          <Button disabled={finished || playback.running} onClick={shoot}>
            Launch ball
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShots(0);
              setFlight(null);
              playback.reset();
            }}
          >
            Restart level
          </Button>
        </div>
        {flight && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => (playback.running ? playback.pause() : playback.resume())}
            >
              {playback.running ? "Pause flight" : "Replay / resume flight"}
            </Button>
            <Button variant="ghost" onClick={playback.reset}>
              Skip animation
            </Button>
            <span className="text-sm">Flight replay · {Math.round(playback.progress * 100)}%</span>
          </div>
        )}
        <p role="status">
          {flight &&
            (won
              ? `Goal! Score: ${golfScore(shots)} / 100.`
              : finished
                ? "Run finished. Restart to try again."
                : flight.outcome === "collision"
                  ? "Collision. Adjust your aim and try again."
                  : flight.outcome === "out"
                    ? "Out of bounds. Try another angle or power."
                    : "Flight timed out after 12 simulated seconds. Try again.")}
        </p>
        <p className="text-sm">
          Physics are calculated immediately; the ball then replays the path. Pause, replay or skip
          at any time. Reduced-motion mode shows the final path immediately. Score: 100 for a
          first-shot goal, minus 10 per extra shot. Simplified inverse-square attraction, fixed time
          steps, stationary planets and arbitrary units: not an astronomical simulator.
        </p>
      </Card>
      <PersonalBest record={record} />
    </>
  );
}
/** Each world gets its own skin, so "the amber giant" is a thing you can say.
 * Lit from the upper left; a shared terminator overlay darkens the far limb. */
const PLANET_SKINS = [
  { core: "#fde68a", mid: "#f59e0b", edge: "#7c2d12", air: "#fbbf24" },
  { core: "#bfdbfe", mid: "#3b82f6", edge: "#172554", air: "#60a5fa" },
  { core: "#ddd6fe", mid: "#8b5cf6", edge: "#3b0764", air: "#a78bfa" },
  { core: "#bbf7d0", mid: "#10b981", edge: "#064e3b", air: "#34d399" },
];

/** Deterministic surface pocks — same planet, same craters, every render. */
function craters(p: { x: number; y: number; radius: number }, seed: number) {
  return Array.from({ length: 5 }, (_, k) => {
    const angle = (((k * 73 + seed * 29) % 360) * Math.PI) / 180;
    const distance = (0.22 + ((k * 37 + seed * 11) % 48) / 100) * p.radius;
    return {
      x: p.x + Math.cos(angle) * distance,
      y: p.y + Math.sin(angle) * distance,
      r: p.radius * (0.07 + ((k * 17 + seed * 7) % 9) / 100),
    };
  });
}

/** Dimple field for the ball, in units of its radius. */
const DIMPLES = [
  [-0.38, -0.3],
  [0.12, -0.46],
  [0.46, -0.06],
  [-0.12, 0.2],
  [0.3, 0.42],
  [-0.46, 0.22],
];

export default function GravityGolf() {
  const [level, setLevel] = useState(0);
  return (
    <GameFrame id="gravity-golf" title="Gravity Golf" intro="Let gravity bend your best shot.">
      <label>
        Level{" "}
        <select
          aria-label="Level"
          className="ml-3 rounded border p-2 bg-[var(--background)]"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
        >
          {GOLF_LEVELS.map((l, i) => (
            <option key={l.name} value={i}>
              {i + 1}. {l.name}
            </option>
          ))}
        </select>
      </label>
      <Course key={level} index={level} level={GOLF_LEVELS[level]!} />
    </GameFrame>
  );
}
