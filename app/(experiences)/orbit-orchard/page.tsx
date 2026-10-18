"use client";

import { useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { collectedRings, launch, LEVELS, scoreRun, simulate, type Body } from "./logic";

const SCALE = 0.75; // world units → canvas pixels (500×500 canvas shows ±333 units)

export default function OrbitOrchardPage() {
  const record = usePersonalBest("orbit-orchard");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [angle, setAngle] = useState(-90);
  const [showPreview, setShowPreview] = useState(true);
  const [collected, setCollected] = useState<number[]>([]);
  const [flightDone, setFlightDone] = useState(false);
  const level = LEVELS[levelIndex] ?? LEVELS[0]!;

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
  }, [angle, levelIndex, showPreview, collected, flightDone]);

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
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Levels">
          {LEVELS.map((l, i) => (
            <Button
              key={l.name}
              variant={i === levelIndex ? "default" : "outline"}
              onClick={() => {
                setLevelIndex(i);
                setCollected([]);
                setFlightDone(false);
              }}
              aria-pressed={i === levelIndex}
            >
              {i + 1}. {l.name}
            </Button>
          ))}
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
          <Button
            variant={showPreview ? "default" : "outline"}
            onClick={() => setShowPreview(!showPreview)}
            aria-pressed={showPreview}
          >
            Trajectory preview {showPreview ? "on" : "off"}
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
          {scoreRun(collected.length, level.rings.length)} / 100
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
    </GameFrame>
  );
}
