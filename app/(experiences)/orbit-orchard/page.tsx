"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { ChoiceStrip } from "@/lib/components/games/ChoiceStrip";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { usePlayback } from "@/lib/hooks/usePlayback";
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
  /** The fired trajectory. While it is being flown the outcome stays hidden —
   * the whole point of a launch is watching where the seed ends up. */
  const [flightPath, setFlightPath] = useState<Body[] | null>(null);
  const playback = usePlayback();
  const [showHint, setShowHint] = useState(false);
  const level = LEVELS[levelIndex] ?? LEVELS[0]!;

  // Derived, not stored: the shot is "done" exactly when its flight has been
  // played out, and what it collected follows from the path itself.
  const flightDone = flightPath !== null && !playback.running && playback.progress >= 1;
  const collected = useMemo(
    () => (flightDone && flightPath ? collectedRings(flightPath, level.rings) : []),
    [flightDone, flightPath, level.rings]
  );

  function toCanvas(x: number, y: number): [number, number] {
    return [250 + x * SCALE, 250 + y * SCALE];
  }

  function draw(path: Body[] = [], head: Body | null = null) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    const space = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.78);
    space.addColorStop(0, "#141c3d");
    space.addColorStop(1, "#05070f");
    ctx.fillStyle = space;
    ctx.fillRect(0, 0, w, h);

    // Deterministic starfield: same sky on every device and every render.
    ctx.fillStyle = "#e2e8f0";
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.15 + ((i * 31) % 40) / 150;
      ctx.beginPath();
      ctx.arc((i * 149 + 37) % w, (i * 83 + 19) % h, i % 5 === 0 ? 1.4 : 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Fruit rings.
    for (const ring of level.rings) {
      const [rx, ry] = toCanvas(ring.x, ring.y);
      const got = collected.includes(ring.id);
      const radius = ring.r * SCALE;
      const halo = ctx.createRadialGradient(rx, ry, radius * 0.2, rx, ry, radius * 1.7);
      halo.addColorStop(0, got ? "rgba(52,211,153,0.3)" : "rgba(148,163,184,0.12)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(rx, ry, radius * 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = got ? "#34d399" : "#8296b0";
      ctx.lineWidth = got ? 4 : 2;
      ctx.setLineDash(got ? [] : [7, 6]);
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const fruit = ctx.createRadialGradient(rx - 3, ry - 4, 1, rx, ry, 9);
      fruit.addColorStop(0, got ? "#d1fae5" : "#fecaca");
      fruit.addColorStop(1, got ? "#059669" : "#b91c1c");
      ctx.fillStyle = fruit;
      ctx.beginPath();
      ctx.arc(rx, ry, 8, 0, Math.PI * 2);
      ctx.fill();
      if (got) {
        // A tick, so a threaded ring is not signalled by colour alone.
        ctx.strokeStyle = "#052e16";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(rx - 3.6, ry);
        ctx.lineTo(rx - 1, ry + 3);
        ctx.lineTo(rx + 4, ry - 3.6);
        ctx.stroke();
      }
    }

    // The star.
    const [sx, sy] = toCanvas(0, 0);
    const corona = ctx.createRadialGradient(sx, sy, 6, sx, sy, 56);
    corona.addColorStop(0, "rgba(253,224,71,0.8)");
    corona.addColorStop(0.36, "rgba(251,146,60,0.32)");
    corona.addColorStop(1, "rgba(251,146,60,0)");
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(sx, sy, 56, 0, Math.PI * 2);
    ctx.fill();
    const core = ctx.createRadialGradient(sx - 4, sy - 5, 2, sx, sy, 16);
    core.addColorStop(0, "#fffbeb");
    core.addColorStop(0.6, "#fcd34d");
    core.addColorStop(1, "#f59e0b");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();

    // Launch pad.
    const [ox, oy] = toCanvas(level.origin.x, level.origin.y);
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.ellipse(ox, oy + 7, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ox, oy + 7, 15, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#bfdbfe";
    ctx.fillRect(ox - 3, oy - 4, 6, 11);

    // Hint ray: the documented winning direction, drawn but never fired.
    const hintDegrees = HINT_DEGREES[levelIndex];
    if (showHint && hintDegrees !== undefined) {
      const rad = (hintDegrees * Math.PI) / 180;
      ctx.save();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(rad) * 120, oy + Math.sin(rad) * 120);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#fbbf24";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText(
        `${hintDegrees}deg`,
        ox + Math.cos(rad) * 132 - 14,
        oy + Math.sin(rad) * 132 + 4
      );
    }

    // Trajectory, stroked twice so it glows against the starfield.
    if (path.length > 1) {
      const trace = () => {
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const [px, py] = toCanvas(path[i]!.x, path[i]!.y);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };
      ctx.lineJoin = "round";
      ctx.strokeStyle = head ? "rgba(165,180,252,0.28)" : "rgba(148,163,184,0.2)";
      ctx.lineWidth = head ? 6 : 4;
      trace();
      ctx.strokeStyle = head ? "#c7d2fe" : "#94a3b8";
      ctx.lineWidth = 1.6;
      if (!head) ctx.setLineDash([5, 5]);
      trace();
      ctx.setLineDash([]);
    }

    // The seed itself, while it is in flight.
    if (head) {
      const [hx, hy] = toCanvas(head.x, head.y);
      const glow = ctx.createRadialGradient(hx, hy, 1, hx, hy, 16);
      glow.addColorStop(0, "rgba(224,242,254,0.9)");
      glow.addColorStop(1, "rgba(224,242,254,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(hx, hy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  useEffect(() => {
    if (flightPath) {
      // Reveal the flight up to wherever the playback has got to.
      const upTo = Math.max(2, Math.ceil(flightPath.length * playback.progress));
      const flown = flightPath.slice(0, upTo);
      draw(flown, playback.progress < 1 ? (flown[flown.length - 1] ?? null) : null);
      return;
    }
    const body = launch((angle * Math.PI) / 180, level.launchPower, level.origin);
    draw(showPreview ? simulate(body, 120 * 12) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, levelIndex, showPreview, collected, showHint, flightPath, playback.progress]);

  // A clean sweep of the final orchard banks the run. Writing to the record
  // store is an external effect, not React state, so it belongs here.
  useEffect(() => {
    if (!flightDone) return;
    if (collected.length !== level.rings.length) return;
    if (levelIndex !== LEVELS.length - 1) return;
    record.save(100);
  }, [flightDone, collected.length, level.rings.length, levelIndex, record]);

  /** Physics runs once, up front; the playback only decides how much of the
   * finished path has been revealed so far. */
  function fire() {
    const body = launch((angle * Math.PI) / 180, level.launchPower, level.origin);
    setFlightPath(simulate(body, 120 * 12));
    playback.play(2200);
  }

  function replay() {
    if (!flightPath) return;
    playback.play(2200);
  }

  function clearShot() {
    setFlightPath(null);
  }

  return (
    <GameFrame
      id="orbit-orchard"
      title="Orbit Orchard"
      intro="Launch a seed around the star and thread it through every fruit ring. Toggle the trajectory preview to plan each shot. Simulated in fixed steps — identical on every device."
    >
      <Card className="p-6 space-y-4">
        <ChoiceStrip label="Levels">
          {LEVELS.map((l, i) => (
            <Button
              key={l.name}
              variant={i === levelIndex ? "default" : "outline"}
              onClick={() => {
                setLevelIndex(i);
                clearShot();
              }}
              aria-pressed={i === levelIndex}
            >
              {i + 1}. {l.name}
            </Button>
          ))}
        </ChoiceStrip>

        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="board mx-auto w-full"
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
              clearShot();
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
          <Button
            variant={showHint ? "default" : "outline"}
            onClick={() => setShowHint(!showHint)}
            aria-pressed={showHint}
            disabled={HINT_DEGREES[levelIndex] === undefined}
          >
            {showHint ? "Hide hint direction" : "Show hint direction"}
          </Button>
          <Button onClick={fire} disabled={playback.running}>
            Launch seed
          </Button>
          <Button variant="outline" onClick={replay} disabled={!flightPath || playback.running}>
            Replay flight
          </Button>
          <Button variant="outline" onClick={clearShot}>
            Reset shot
          </Button>
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]" aria-live="polite">
          {playback.running
            ? "Seed in flight…"
            : flightDone
              ? `Rings threaded: ${collected.length} / ${level.rings.length} · score ${scoreRun(collected.length, level.rings.length)} / 100`
              : `${level.rings.length} rings to thread · launch to find out`}
        </p>

        {flightDone && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => record.save(scoreRun(collected.length, level.rings.length))}
            >
              Save this score
            </Button>
            <Button variant="outline" onClick={clearShot}>
              Try again
            </Button>
          </div>
        )}

        {flightDone && collected.length === level.rings.length && (
          <WinScreen headline="Perfect orbit" score={100} detail="Every ring threaded on one shot.">
            {levelIndex + 1 < LEVELS.length && (
              <Button
                onClick={() => {
                  setLevelIndex(levelIndex + 1);
                  clearShot();
                }}
              >
                Next orchard
              </Button>
            )}
            {levelIndex + 1 === LEVELS.length && (
              <Button onClick={() => record.save(100)}>Save perfect run</Button>
            )}
          </WinScreen>
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
