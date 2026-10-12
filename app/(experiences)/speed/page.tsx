"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { speedItems, categories, formatSpeed, type SpeedUnit } from "./data";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

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
              {(["kmh", "mph", "ms"] as SpeedUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  aria-pressed={unit === u}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    unit === u
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {u === "kmh" ? "km/h" : u === "mph" ? "mph" : "m/s"}
                </button>
              ))}
              <button
                onClick={() => {
                  setRaceProgress({});
                  setRaceActive(true);
                }}
                disabled={raceActive || prefersReducedMotion}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {raceActive ? "Racing..." : "🏁 Race"}
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
            <h3 className="text-sm font-medium mb-3">🏁 Live Race Track (log scale)</h3>
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
                    <span className="text-[10px]">{item.emoji}</span>
                  </div>
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-medium truncate max-w-[60%]">
                    {item.emoji} {item.name}
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
              <h3 className="font-bold">⚖️ Comparison</h3>
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
                  <div className="flex items-center justify-center gap-4 text-center">
                    <div>
                      <div className="text-3xl">{slower.emoji}</div>
                      <div className="text-sm font-medium">{slower.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {formatSpeed(slower.speed, unit)}
                      </div>
                    </div>
                    <div className="text-[var(--muted-foreground)]">vs</div>
                    <div>
                      <div className="text-3xl">{faster.emoji}</div>
                      <div className="text-sm font-medium">{faster.name}</div>
                      <div className="text-xs text-[var(--primary)]">
                        {formatSpeed(faster.speed, unit)}
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm">
                    <span className="font-bold text-[var(--primary)]">{faster.name}</span> is{" "}
                    <span className="font-bold">{ratio.toFixed(1)}x</span> faster than {slower.name}
                  </p>
                  <p className="text-center text-xs text-[var(--muted-foreground)]">
                    {faster.emoji} would circle Earth in {timeAroundEarth}h at{" "}
                    {formatSpeed(faster.speed, unit)}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <motion.button
            onClick={() => setSelectedCategory("all")}
            aria-pressed={selectedCategory === "all"}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              selectedCategory === "all"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🌟 All
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                selectedCategory === cat.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.emoji} {cat.name}
            </motion.button>
          ))}
        </div>

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
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-semibold">{item.name}</span>
                      {isInCompare && (
                        <span className="text-[10px] bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-full">
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
                        className="text-[10px] px-2 py-1 rounded-full bg-[var(--secondary)] hover:bg-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity"
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
                        <p className="text-sm text-[var(--muted-foreground)]">💡 {item.funFact}</p>
                      )}
                      <p className="text-xs text-[var(--muted-foreground)]">
                        🌍 Time to circle Earth: {(40075 / item.speed).toFixed(2)}h • 🌙 To Moon:{" "}
                        {(384400 / item.speed).toFixed(1)}h
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
