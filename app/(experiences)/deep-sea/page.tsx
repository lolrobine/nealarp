"use client";

import { creatureShape, Picto } from "@/lib/components/games/Picto";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { DepthIndicator } from "./DepthIndicator";
import { CreatureCard } from "./CreatureCard";
import { RealisticOceanBackground } from "./RealisticOceanBackground";
import { MarineSnow } from "./MarineSnow";
import { sortedCreatures, MAX_DEPTH, getZone, zones } from "./data";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

function bubbleVariation(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function Bubbles({ depth }: { depth: number }) {
  const count = depth < 500 ? 16 : depth < 2000 ? 8 : 3;
  if (depth > 3000) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes bubble-rise {
          0% { transform: translateY(100vh) translateX(0) scale(0.5); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-20px) translateX(var(--drift, 20px)) scale(1.2); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => {
        const size = 3 + bubbleVariation(i, 1) * 6;
        const left = 5 + i * (90 / count) + (bubbleVariation(i, 2) - 0.5) * 5;
        const drift = (Math.sin(i * 1.3) * 40).toFixed(0);
        const duration = 6 + bubbleVariation(i, 3) * 8;
        const delay = i * 0.6 + bubbleVariation(i, 4) * 2;
        const blur = depth > 1000 ? 1 : 0;
        return (
          <div
            key={i}
            className="absolute rounded-full will-change-transform"
            style={
              {
                width: size,
                height: size,
                left: `${left}%`,
                bottom: "-20px",
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.15))`,
                boxShadow: "inset 0 0 4px rgba(255,255,255,0.3), 0 0 6px rgba(100,200,255,0.2)",
                filter: blur ? `blur(${blur}px)` : undefined,
                animation: `bubble-rise ${duration}s linear ${delay}s infinite`,
                ["--drift" as string]: `${drift}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

export default function DeepSeaPage() {
  const [currentDepth, setCurrentDepth] = useState(0);
  const [discoveredCreatures, setDiscoveredCreatures] = useState<Set<string>>(new Set());
  const isMounted = useHydrated();
  const [selectedCreature, setSelectedCreature] = useState<(typeof sortedCreatures)[0] | null>(
    null
  );
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode; osc: OscillatorNode } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!soundEnabled) {
      if (audioRef.current) {
        try {
          audioRef.current.gain.gain.linearRampToValueAtTime(
            0,
            audioRef.current.ctx.currentTime + 0.5
          );
          setTimeout(() => {
            try {
              audioRef.current?.osc.stop();
              audioRef.current?.ctx.close();
            } catch {}
            audioRef.current = null;
          }, 600);
        } catch {
          audioRef.current = null;
        }
      }
      return;
    }
    try {
      const ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 40 + currentDepth / 500; // deeper = slightly lower? Actually deeper maybe lower freq
      osc.connect(gain);
      osc.start();
      gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 1);
      audioRef.current = { ctx, gain, osc };
    } catch {
      // ignore if audio fails
    }
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.osc.stop();
          audioRef.current.ctx.close();
        } catch {}
        audioRef.current = null;
      }
    };
    // currentDepth intentionally excluded — frequency updated in separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  useEffect(() => {
    if (audioRef.current && soundEnabled) {
      try {
        audioRef.current.osc.frequency.linearRampToValueAtTime(
          30 + currentDepth / 400,
          audioRef.current.ctx.currentTime + 0.5
        );
      } catch {}
    }
  }, [currentDepth, soundEnabled]);

  // Total scroll height maps to ocean depth
  const totalScrollHeight = 10000;

  const jumpToDepth = (depth: number) => {
    const progress = depth / MAX_DEPTH;
    const maxScroll =
      (containerRef.current?.scrollHeight || totalScrollHeight) - window.innerHeight;
    window.scrollTo({
      top: progress * maxScroll,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    if (!isMounted) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!containerRef.current) {
          ticking = false;
          return;
        }
        const scrollTop = window.scrollY;
        const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
        const safeMax = Math.max(maxScroll, 1);
        const progress = Math.min(Math.max(scrollTop / safeMax, 0), 1);
        const depth = progress * MAX_DEPTH;

        setCurrentDepth(depth);

        // Track discovered creatures — only update if new found
        setDiscoveredCreatures((prev) => {
          let changed = false;
          const next = new Set(prev);
          sortedCreatures.forEach((creature) => {
            if (Math.abs(depth - creature.depth) < 150 && !next.has(creature.name)) {
              next.add(creature.name);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
        ticking = false;
      });
    };

    // Initial call to set correct depth on mount
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isMounted]);

  const currentZone = getZone(currentDepth) ?? zones[0]!;

  // Determine which creatures are visible — memoized to avoid filter each render
  const visibleCreatures = useMemo(
    () => sortedCreatures.filter((c) => Math.abs(currentDepth - c.depth) < 200),
    [currentDepth]
  );

  return (
    <div ref={containerRef} className="relative" style={{ minHeight: `${totalScrollHeight}px` }}>
      {/* Realistic ocean background with real photos */}
      <RealisticOceanBackground depth={currentDepth} />

      {/* Marine snow particles - realistic floating debris */}
      {isMounted && !prefersReducedMotion && <MarineSnow depth={currentDepth} />}

      {/* Animated bubbles - realistic with glow */}
      {isMounted && !prefersReducedMotion && <Bubbles depth={currentDepth} />}

      {/* Depth Indicator */}
      {isMounted && <DepthIndicator depth={currentDepth} />}

      {/* Main Content - Zone title */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center pointer-events-none">
          <div className="mb-4">
            <h2
              className="text-xl md:text-2xl font-bold"
              style={{
                color: currentDepth < 2000 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
              }}
            >
              {currentZone.name}
            </h2>
            {currentDepth < 100 && isMounted && (
              <p className="text-sm text-white/60 mt-2">Scroll down to dive deeper ↓</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls: Jump to depth + Sound */}
      {isMounted && (
        <div className="fixed top-20 left-4 z-40 flex flex-col gap-3">
          <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl p-3 w-48">
            <label className="text-[10px] text-white/60 uppercase tracking-wider">
              Jump to depth
            </label>
            <input
              type="range"
              min={0}
              max={MAX_DEPTH}
              value={currentDepth}
              onChange={(e) => jumpToDepth(Number(e.target.value))}
              className="w-full accent-blue-400 h-1 mt-1"
              aria-label="Jump to depth"
            />
            <div className="flex justify-between text-[9px] text-white/40 mt-1">
              <span>0m</span>
              <span>11km</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {zones.map((z) => (
                <button
                  key={z.name}
                  onClick={() => jumpToDepth((z.minDepth + z.maxDepth) / 2)}
                  className="min-h-6 inline-flex items-center justify-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/70"
                >
                  {z.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-pressed={soundEnabled}
            className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border transition-colors ${
              soundEnabled
                ? "bg-blue-500/30 border-blue-400/50 text-blue-200"
                : "bg-black/70 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {soundEnabled ? (
              <>
                <Picto name="sound-on" /> Sound on
              </>
            ) : (
              <>
                <Picto name="sound-off" /> Sound off
              </>
            )}
          </button>
        </div>
      )}

      {/* Creature Cards */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-4 items-start max-w-lg">
              {visibleCreatures.map((creature, i) => (
                <div
                  key={creature.name}
                  className="pointer-events-auto"
                  style={{
                    marginLeft: i % 2 === 0 ? "0" : "30%",
                  }}
                  onClick={() => setSelectedCreature(creature)}
                >
                  <CreatureCard creature={creature} isVisible={true} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Creature Modal */}
      {selectedCreature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedCreature(null)}
        >
          <div
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedCreature.name} details`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Picto name={creatureShape(selectedCreature.name)} size={52} />
                <div>
                  <h3 className="text-xl font-bold">{selectedCreature.name}</h3>
                  <p className="text-sm text-[var(--primary)] font-mono">
                    {selectedCreature.depth.toLocaleString()}m deep •{" "}
                    {getZone(selectedCreature.depth).name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCreature(null)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center hover:bg-[var(--muted)]"
              >
                <Picto name="cross" size={16} />
              </button>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {selectedCreature.description}
            </p>
            {selectedCreature.funFact && (
              <div className="bg-[var(--secondary)] rounded-xl p-3 mb-4">
                <p className="text-xs text-[var(--muted-foreground)]">
                  <Picto name="bulb" size={14} />{" "}
                  <span className="text-[var(--foreground)] font-medium">
                    {selectedCreature.funFact}
                  </span>
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  jumpToDepth(selectedCreature.depth);
                  setSelectedCreature(null);
                }}
                className="flex-1 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium"
              >
                Dive to {selectedCreature.depth}m
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${selectedCreature.name} lives at ${selectedCreature.depth}m deep — ${selectedCreature.description}`
                    );
                  } catch {}
                }}
                className="px-4 py-2 bg-[var(--secondary)] rounded-lg text-sm"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Counter */}
      {isMounted && (
        <div className="fixed bottom-4 left-16 z-40">
          <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-white/60">Creatures Found</div>
            <div className="text-lg font-bold text-blue-400" aria-live="polite" aria-atomic="true">
              {discoveredCreatures.size} / {sortedCreatures.length}
            </div>
          </div>
        </div>
      )}

      {/* Mini Progress Map - right side */}
      {isMounted && (
        <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 hidden md:block">
          <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-full p-1 w-8 flex flex-col items-center">
            <div className="relative w-1 h-[40vh] bg-white/10 rounded-full overflow-hidden">
              {/* Zones */}
              {zones.map((zone) => {
                const top = (zone.minDepth / MAX_DEPTH) * 100;
                const height = ((zone.maxDepth - zone.minDepth) / MAX_DEPTH) * 100;
                return (
                  <div
                    key={zone.name}
                    className="absolute left-0 right-0"
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      backgroundColor: zone.color,
                      opacity: 0.6,
                    }}
                  />
                );
              })}
              {/* Current depth indicator */}
              <div
                className="absolute left-0 right-0 h-1 bg-white rounded-full shadow-[0_0_6px_white] transition-all duration-150"
                style={{ top: `${(currentDepth / MAX_DEPTH) * 100}%` }}
              />
              {/* Creature dots */}
              {sortedCreatures.map((c) => (
                <div
                  key={`dot-${c.name}`}
                  className={`absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    discoveredCreatures.has(c.name) ? "bg-emerald-400" : "bg-white/40"
                  }`}
                  style={{ top: `${(c.depth / MAX_DEPTH) * 100}%` }}
                  title={`${c.name} @ ${c.depth}m`}
                />
              ))}
            </div>
            <div className="mt-1 text-[8px] text-white/50 font-mono">
              {Math.round((currentDepth / MAX_DEPTH) * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Title overlay (shown at start) */}
      {currentDepth < 50 && isMounted && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 className="flex flex-wrap items-center justify-center gap-4 text-5xl md:text-7xl font-bold text-white mb-4">
              <GameIcon
                src="/experiences/deep-sea/icon.webp"
                alt="Deep Sea icon"
                className="h-12 w-12 rounded-xl border border-white/30 object-cover md:h-16 md:w-16"
              />
              The Deep Sea
            </h1>
            <p className="text-xl text-white/70">Scroll to explore the ocean depths</p>
            <motion.p
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-white/50 mt-8 text-2xl"
            >
              ↓
            </motion.p>
          </div>
        </div>
      )}

      {/* Bottom message */}
      {currentDepth > MAX_DEPTH - 100 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h2 className="mb-2 flex items-center justify-center gap-2 text-3xl font-bold text-white/90">
              <Picto name="trophy" size={28} /> Challenger Deep
            </h2>
            <p className="text-white/60">11,034 meters — The deepest point on Earth</p>
          </div>
        </div>
      )}
    </div>
  );
}
