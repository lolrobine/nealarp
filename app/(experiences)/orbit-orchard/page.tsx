"use client";

import { useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { BestPill, SegmentedControl } from "@/lib/components/games/SettingsRow";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  collectedRings,
  HINT_DEGREES,
  launch,
  LEVELS,
  scoreRun,
  simulate,
  type Body,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const SCALE = 0.75; // world units → canvas pixels (500×500 canvas shows ±333 units)

export default function OrbitOrchardPage() {
  const record = usePersonalBest("orbit-orchard");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [angle, setAngle] = useState(-90);
  const [showPreview, setShowPreview] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [collected, setCollected] = useState<number[]>([]);
  const [flightDone, setFlightDone] = useState(false);
  const level = LEVELS[levelIndex] ?? LEVELS[0]!;
  const hintDeg = HINT_DEGREES[levelIndex];

  function toCanvas(x: number, y: number): [number, number] {
    return [250 + x * SCALE, 250 + y * SCALE];
  }

  function draw(path: Body[] = []) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#0b1026";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // star
    const [sx, sy] = toCanvas(0, 0);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(sx, sy, 14, 0, Math.PI * 2);
    ctx.fill();
    // rings
    for (const ring of level.rings) {
      const [rx, ry] = toCanvas(ring.x, ring.y);
      ctx.strokeStyle = collected.includes(ring.id) ? "#34d399" : "#64748b";
      ctx.lineWidth = collected.includes(ring.id) ? 4 : 2;
      ctx.beginPath();
      ctx.arc(rx, ry, ring.r * SCALE, 0, Math.PI * 2);
      ctx.stroke();
    }
    // launch pad
    const [ox, oy] = toCanvas(level.origin.x, level.origin.y);
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(ox - 5, oy - 5, 10, 10);

    // Launch direction indicator from pad (points in current angle)
    {
      const rad = (angle * Math.PI) / 180;
      const len = 44;
      ctx.strokeStyle = "rgba(165,180,252,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(rad) * len, oy + Math.sin(rad) * len);
      ctx.stroke();
    }

    // Hint arrow
    if (showHint && hintDeg !== undefined) {
      const rad = (hintDeg * Math.PI) / 180;
      const len = 70;
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(rad) * len, oy + Math.sin(rad) * len);
      ctx.stroke();
      ctx.setLineDash([]);
      const hx = ox + Math.cos(rad) * (len + 10);
      const hy = oy + Math.sin(rad) * (len + 10);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // path
    if (path.length > 1) {
      ctx.strokeStyle = "#a5b4fc";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const [px, py] = toCanvas(path[i]!.x, path[i]!.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  useEffect(() => {
    const body = launch((angle * Math.PI) / 180, level.launchPower, level.origin);
    const previewPath = showPreview ? simulate(body, 120 * 12) : [];
    draw(flightDone ? simulate(body, 120 * 12) : previewPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, levelIndex, showPreview, showHint, collected, flightDone]);

  function fire() {
    const body = launch((angle * Math.PI) / 180, level.launchPower, level.origin);
    const path = simulate(body, 120 * 12);
    const hit = collectedRings(path, level.rings);
    setCollected(hit);
    setFlightDone(true);
    if (hit.length === level.rings.length && levelIndex === LEVELS.length - 1) {
      record.save(100);
    }
  }

  return (
    <GameFrame
      id="orbit-orchard"
      title="Orbit Orchard"
      intro="Launch a seed around the star and thread it through every fruit ring. Toggle the trajectory preview to plan each shot. Simulated in fixed steps — identical on every device."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SegmentedControl
            label="Levels"
            value={String(levelIndex)}
            onChange={(v) => {
              setLevelIndex(Number(v));
              setCollected([]);
              setFlightDone(false);
              setShowHint(false);
            }}
            options={LEVELS.map((l, i) => ({ value: String(i), label: `${i + 1}` }))}
          />
          <span className="text-sm font-medium text-[var(--muted-foreground)]">{level.name}</span>
          <BestPill best={record.best} />
        </div>

        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="mx-auto w-full rounded-xl border border-[var(--border)]"
          style={{ maxWidth: 500, aspectRatio: "1 / 1" }}
          role="img"
          aria-label={`Level ${level.name}. ${collected.length} of ${level.rings.length} rings threaded.`}
        />

        <label className="block">
          <span className="text-sm">
            Launch angle: <strong>{angle}°</strong>
          </span>
          <input
            type="range"
            min={-180}
            max={180}
            value={angle}
            onChange={(e) => {
              setAngle(Number(e.target.value));
              setFlightDone(false);
            }}
            className="mt-2 w-full"
            aria-label={`Launch angle ${angle} degrees`}
          />
        </label>

        <div className="flex flex-wrap justify-center gap-2">
          <SegmentedControl
            label="Trajectory preview"
            value={showPreview ? "on" : "off"}
            onChange={(v) => setShowPreview(v === "on")}
            options={[
              { value: "on", label: "Preview on" },
              { value: "off", label: "Preview off" },
            ]}
          />
          <Button
            size="sm"
            variant={showHint ? "default" : "outline"}
            onClick={() => setShowHint(!showHint)}
            aria-pressed={showHint}
          >
            {showHint ? "Hide hint" : "Hint"}
          </Button>
          <Button onClick={fire}>Launch seed</Button>
          <Button
            variant="outline"
            onClick={() => {
              setCollected([]);
              setFlightDone(false);
            }}
          >
            Reset shot
          </Button>
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]" aria-live="polite">
          Rings threaded: <strong>{collected.length}</strong> / {level.rings.length} · score{" "}
          <strong className="tabular-nums">{scoreRun(collected.length, level.rings.length)}</strong>{" "}
          / 100
          {showHint && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">· aim ≈ {hintDeg}°</span>
          )}
        </p>

        {flightDone && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => record.save(scoreRun(collected.length, level.rings.length))}
            >
              Save this score
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCollected([]);
                setFlightDone(false);
              }}
            >
              Try again
            </Button>
          </div>
        )}

        {flightDone && collected.length === level.rings.length && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">Perfect orbit!</p>
            {levelIndex + 1 < LEVELS.length && (
              <Button
                className="mt-2"
                onClick={() => {
                  setLevelIndex(levelIndex + 1);
                  setCollected([]);
                  setFlightDone(false);
                }}
              >
                Next orchard
              </Button>
            )}
            {levelIndex + 1 === LEVELS.length && (
              <Button className="mt-2" onClick={() => record.save(100)}>
                Save perfect run
              </Button>
            )}
          </div>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="A full-clear launch">
        <ExampleStep n={1}>
          Toggle the trajectory preview — it runs the exact same fixed-step physics forward. Aim
          inside the arc of the rings, not at the nearest one.
        </ExampleStep>
        <ExampleStep n={2}>
          The rings sit on real simulated orbits. Known clears: First orbit ≈ 316° (up-right),
          Slingshot ≈ 26° (right-down), Grand tour ≈ 140° (left-down). Windows are 11–19° wide.
        </ExampleStep>
        <ExampleResult>Thread every ring: score = collected / total × 100 = 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
