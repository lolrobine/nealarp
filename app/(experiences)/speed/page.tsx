"use client";

import { ChoiceStrip } from "@/lib/components/games/ChoiceStrip";
import { SegmentedControl } from "@/lib/components/ui/segmented-control";
import { Picto, type PictoName } from "@/lib/components/games/Picto";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { speedItems, categories, formatSpeed, type SpeedItem, type SpeedUnit } from "./data";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

/** Thirty items, four categories: each row shows the silhouette of its family
 *  rather than a per-item emoji. */
const CATEGORY_PICTO: Record<string, PictoName> = {
  animals: "animals",
  vehicles: "vehicles",
  tech: "tech",
  nature: "nature",
};

const LAP_MS = 3200;
const TRACK_W = 640;
const TRACK_H = 168;
const LANE_X0 = 18;
const LANE_X1 = TRACK_W - 18;
const LANE_SPAN = LANE_X1 - LANE_X0;

/** One runner: a capsule with streaks whose length follows how fast it is going. */
function drawRunner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
  speedShare: number
) {
  const streak = 10 + speedShare * 70;
  const trail = ctx.createLinearGradient(x - streak, y, x, y);
  trail.addColorStop(0, "rgba(255,255,255,0)");
  trail.addColorStop(1, colour);
  ctx.strokeStyle = trail;
  ctx.lineCap = "round";
  for (const [dy, w] of [
    [-7, 2],
    [0, 3],
    [7, 2],
  ] as const) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x - streak, y + dy);
    ctx.lineTo(x - 11, y + dy);
    ctx.stroke();
  }
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x - 2, y, 15, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 11, y - 7);
  ctx.lineTo(x + 24, y);
  ctx.lineTo(x + 11, y + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.ellipse(x - 5, y - 3, 6, 2.6, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawLane(ctx: CanvasRenderingContext2D, y: number) {
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.beginPath();
  ctx.roundRect(LANE_X0 - 8, y - 30, LANE_SPAN + 16, 60, 14);
  ctx.fill();
  ctx.save();
  ctx.setLineDash([14, 14]);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LANE_X0, y);
  ctx.lineTo(LANE_X1, y);
  ctx.stroke();
  ctx.restore();
  // start line and chequered finish
  ctx.fillStyle = "rgba(226, 232, 240, 0.45)";
  ctx.fillRect(LANE_X0 - 3, y - 26, 3, 52);
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(241,245,249,0.85)" : "rgba(30,41,59,0.9)";
    ctx.fillRect(LANE_X1, y - 26 + i * 9, 10, 9);
  }
}

/** The two speeds, run side by side in real proportion. */
function CompareRace({
  slower,
  faster,
  still,
}: {
  slower: SpeedItem;
  faster: SpeedItem;
  still: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ratio = faster.speed / Math.max(slower.speed, 1e-9);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const paint = (t: number) => {
      ctx.clearRect(0, 0, TRACK_W, TRACK_H);
      const laneY = [56, 124];
      laneY.forEach((y) => drawLane(ctx, y));
      // The faster one crosses in one lap; the slower one covers 1/ratio of it.
      drawRunner(
        ctx,
        LANE_X0 + LANE_SPAN * Math.min(t / ratio, 1),
        laneY[0]!,
        "#38bdf8",
        1 / ratio
      );
      drawRunner(ctx, LANE_X0 + LANE_SPAN * t, laneY[1]!, "#f472b6", 1);
    };

    if (still) {
      paint(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      paint(((now - start) % LAP_MS) / LAP_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ratio, still]);

  const share = 100 / ratio;
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={TRACK_W}
        height={TRACK_H}
        aria-hidden="true"
        className="block h-auto w-full rounded-xl"
      />
      <p className="mt-2 text-center text-xs text-[var(--muted-foreground)]" role="status">
        Top lane: {slower.name}. Bottom lane: {faster.name}. In the time {faster.name} crosses the
        track, {slower.name} covers{" "}
        {share < 0.01 ? "less than 0.01%" : `${share < 1 ? share.toFixed(2) : share.toFixed(1)}%`}{" "}
        of it.
        {still ? " Animation is off because your system asks for reduced motion." : ""}
      </p>
    </div>
  );
}

export default function SpeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [unit, setUnit] = useState<SpeedUnit>("kmh");
  const [raceActive, setRaceActive] = useState(false);
  const [raceProgress, setRaceProgress] = useState<Record<string, number>>({});
  const [comparePair, setComparePair] = useState<[string, string] | null>(null);
  const raceRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const filteredItems = useMemo(() => {
    const items =
      selectedCategory === "all"
        ? speedItems
        : speedItems.filter((item) => item.category === selectedCategory);
    return [...items].sort((a, b) => a.speed - b.speed);
  }, [selectedCategory]);

  const { logMin, logMax } = useMemo(() => {
    const speeds = speedItems.map((i) => Math.max(i.speed, 0.01));
    return {
      logMin: Math.log10(Math.min(...speeds)),
      logMax: Math.log10(Math.max(...speeds)),
    };
  }, []);

  // Race track: animate dots moving proportional to speed (log scale for visibility)
  useEffect(() => {
    if (!raceActive || prefersReducedMotion) {
      if (raceRef.current) cancelAnimationFrame(raceRef.current);
      return;
    }
    const start = performance.now();
    const duration = 5000;
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const progress: Record<string, number> = {};
      filteredItems.forEach((item) => {
        const logSpeed = Math.log10(Math.max(item.speed, 0.01));
        const normalized = (logSpeed - logMin) / (logMax - logMin);
        const base = 0.05 + normalized * 0.95;
        progress[item.name] = Math.min(100, t * base * 120);
      });
      setRaceProgress(progress);
      if (t < 1) {
        raceRef.current = requestAnimationFrame(animate);
      } else {
        setRaceActive(false);
      }
    };
    raceRef.current = requestAnimationFrame(animate);
    return () => {
      if (raceRef.current) cancelAnimationFrame(raceRef.current);
    };
  }, [raceActive, filteredItems, prefersReducedMotion, logMin, logMax]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl md:text-6xl font-bold mb-4">
            <GameIcon
              src="/experiences/speed/icon.webp"
              alt="Speed icon"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            Speed
          </h1>
          <p className="text-xl text-[var(--muted-foreground)]">Compare the speed of everything</p>
        </div>

        {/* Controls */}
        <div className="mb-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="speed-multiplier" className="block text-sm font-medium mb-2">
                Time Multiplier: {speedMultiplier}x
              </label>
              <input
                id="speed-multiplier"
                type="range"
                min="1"
                max="100"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
                aria-label="Time multiplier"
              />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <SegmentedControl
                label="Unit"
                value={unit}
                options={[
                  { id: "kmh", label: "km/h" },
                  { id: "mph", label: "mph" },
                  { id: "ms", label: "m/s" },
                ]}
                onChange={(id) => setUnit(id as SpeedUnit)}
              />
              <button
                onClick={() => {
                  setRaceProgress({});
                  setRaceActive(true);
                }}
                disabled={raceActive || prefersReducedMotion}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {raceActive ? (
                  "Racing..."
                ) : (
                  <>
                    <Picto name="flag" /> Race
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Bars use log scale to show huge range (snail to light). Click Race to visualize!
          </p>
        </div>

        {/* Race Track Visualization */}
        {(raceActive || Object.keys(raceProgress).length > 0) && (
          <div className="mb-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 overflow-hidden">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Picto name="flag" /> Live Race Track (log scale)
            </h3>
            <div className="space-y-2">
              {filteredItems.slice(-8).map((item) => (
                <div
                  key={`race-${item.name}`}
                  className="relative h-6 bg-[var(--secondary)] rounded-full overflow-hidden"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] to-cyan-400 rounded-full transition-none flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(100, raceProgress[item.name] || 0)}%` }}
                  >
                    <Picto name={CATEGORY_PICTO[item.category] ?? "nature"} size={10} />
                  </div>
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-medium truncate max-w-[60%]">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compare Mode */}
        {comparePair && (
          <div className="mb-8 bg-[var(--card)] border border-[var(--primary)]/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Head to head</h3>
              <button
                onClick={() => setComparePair(null)}
                className="text-xs px-2 py-1 bg-[var(--secondary)] rounded-full"
              >
                Clear
              </button>
            </div>
            {(() => {
              const a = speedItems.find((i) => i.name === comparePair[0]);
              const b = speedItems.find((i) => i.name === comparePair[1]);
              if (!a || !b) return null;
              const faster = a.speed > b.speed ? a : b;
              const slower = a.speed > b.speed ? b : a;
              const ratio = faster.speed / slower.speed;
              const timeAroundEarth = (40075 / faster.speed).toFixed(1); // hours
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-6 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <span className="h-3 w-3 rounded-full bg-sky-400" aria-hidden="true" />
                        {slower.name}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {formatSpeed(slower.speed, unit)}
                      </div>
                    </div>
                    <div className="text-[var(--muted-foreground)]">vs</div>
                    <div>
                      <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <span className="h-3 w-3 rounded-full bg-pink-400" aria-hidden="true" />
                        {faster.name}
                      </div>
                      <div className="text-xs text-[var(--primary)]">
                        {formatSpeed(faster.speed, unit)}
                      </div>
                    </div>
                  </div>

                  <CompareRace slower={slower} faster={faster} still={prefersReducedMotion} />
                  <p className="text-center text-sm">
                    <span className="font-bold text-[var(--primary)]">{faster.name}</span> is{" "}
                    <span className="font-bold">{ratio.toFixed(1)}x</span> faster than {slower.name}
                  </p>
                  <p className="text-center text-xs text-[var(--muted-foreground)]">
                    {faster.name} would circle Earth in {timeAroundEarth}h at{" "}
                    {formatSpeed(faster.speed, unit)}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Categories */}
        <ChoiceStrip label="Categories" className="mb-8">
          <motion.button
            onClick={() => setSelectedCategory("all")}
            aria-pressed={selectedCategory === "all"}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              selectedCategory === "all"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                selectedCategory === cat.id
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Picto name={CATEGORY_PICTO[cat.id] ?? "nature"} /> {cat.name}
            </motion.button>
          ))}
        </ChoiceStrip>

        {/* Speed Visualization - log scale */}
        <div className="space-y-3">
          {filteredItems.map((item, index) => {
            const logSpeed = Math.log10(Math.max(item.speed, 0.01));
            const widthPercent = ((logSpeed - logMin) / (logMax - logMin)) * 100;
            const isSelected = selectedItem === item.name;
            const isInCompare = comparePair?.includes(item.name);

            return (
              <div
                key={item.name}
                onClick={() => setSelectedItem(isSelected ? null : item.name)}
                className="cursor-pointer group"
              >
                <div
                  className={`bg-[var(--card)] border rounded-xl p-4 hover:border-[var(--primary)]/50 transition-all ${isInCompare ? "border-[var(--primary)]/50 bg-[var(--primary)]/5" : "border-[var(--border)]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Picto name={CATEGORY_PICTO[item.category] ?? "nature"} size={24} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(isSelected ? null : item.name);
                        }}
                        aria-expanded={isSelected}
                        className="font-semibold text-left"
                      >
                        {item.name}
                      </button>
                      {isInCompare && (
                        <span className="text-[10px] bg-[var(--primary)] text-[var(--primary-foreground)] px-1.5 py-0.5 rounded-full">
                          COMPARE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-[var(--primary)]">
                        {formatSpeed(item.speed * speedMultiplier, unit)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!comparePair) setComparePair([item.name, item.name]);
                          else if (comparePair[0] === item.name && comparePair[1] === item.name)
                            setComparePair(null);
                          else if (comparePair[0] === comparePair[1])
                            setComparePair([comparePair[0], item.name]);
                          else setComparePair([item.name, comparePair[1]]);
                        }}
                        aria-label={`Compare ${item.name}`}
                        aria-pressed={isInCompare}
                        className={`min-h-[24px] rounded-full px-2 py-1 text-[10px] transition-colors ${
                          isInCompare
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "bg-[var(--secondary)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        Compare
                      </button>
                    </div>
                  </div>

                  <div className="relative h-3 bg-[var(--secondary)] rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(widthPercent, 0.5)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.02 }}
                    />
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                      {item.funFact && (
                        <p className="text-sm text-[var(--muted-foreground)]">
                          <Picto name="bulb" size={14} /> {item.funFact}
                        </p>
                      )}
                      <p className="text-xs text-[var(--muted-foreground)]">
                        <Picto name="globe" size={13} /> Time to circle Earth:{" "}
                        {(40075 / item.speed).toFixed(2)}h • <Picto name="moon" size={13} /> To
                        Moon: {(384400 / item.speed).toFixed(1)}h
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-[var(--muted-foreground)]">
          <p>
            Click on any item to see fun facts! Use Compare to pit two speeds against each other.
          </p>
        </div>
      </div>
    </div>
  );
}
