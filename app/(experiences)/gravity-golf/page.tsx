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
          <circle cx={level.start.x} cy={level.start.y} r="7" fill="white" />
          <text x={level.start.x - 15} y={level.start.y + 25} fill="white" fontSize="14">
            TEE
          </text>
          <circle
            cx={level.goal.x}
            cy={level.goal.y}
            r="22"
            fill="none"
            stroke="#4ade80"
            strokeWidth="3"
            strokeDasharray="5"
          />
          <text x={level.goal.x - 20} y={level.goal.y - 30} fill="white" fontSize="14">
            GOAL
          </text>
          {level.planets.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.radius + 15}
                fill="none"
                stroke="#818cf8"
                strokeOpacity=".15"
                strokeWidth="10"
              />
              <circle cx={p.x} cy={p.y} r={p.radius} fill={`url(#${gradientId})`} />
              <ellipse
                cx={p.x}
                cy={p.y}
                rx={p.radius * 1.35}
                ry={p.radius * 0.3}
                fill="none"
                stroke="#c4b5fd"
                strokeWidth="2"
                opacity=".6"
                transform={`rotate(-22 ${p.x} ${p.y})`}
              />
            </g>
          ))}
          {level.walls.map((w, i) => (
            <rect key={i} {...w} width={w.w} height={w.h} fill="#fbbf24" />
          ))}
          {shownPath && (
            <polyline points={points(shownPath)} fill="none" stroke="#fbbf24" strokeWidth="2" />
          )}
          <circle cx={ball.x} cy={ball.y} r="6" fill="#f8fafc" stroke="#38bdf8" strokeWidth="3" />
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
