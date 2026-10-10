"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { DepthIndicator } from "./DepthIndicator";
import { CreatureCard } from "./CreatureCard";
import { sortedCreatures, MAX_DEPTH, getBackgroundColor, getZone } from "./data";

function Bubbles() {
  const [windowHeight, setWindowHeight] = useState(800);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/5"
          style={{
            width: 4 + i * 3,
            height: 4 + i * 3,
            left: `${10 + i * 12}%`,
          }}
          animate={{
            y: [windowHeight + 20, -20],
            x: [0, Math.sin(i) * 30],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export default function DeepSeaPage() {
  const [currentDepth, setCurrentDepth] = useState(0);
  const [discoveredCreatures, setDiscoveredCreatures] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Total scroll height maps to ocean depth
  const totalScrollHeight = 10000;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = window.scrollY;
      const maxScroll = containerRef.current.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / Math.max(maxScroll, 1), 1);
      const depth = progress * MAX_DEPTH;

      setCurrentDepth(depth);

      // Track discovered creatures
      setDiscoveredCreatures((prev) => {
        const newlyDiscovered = new Set(prev);
        sortedCreatures.forEach((creature) => {
          if (Math.abs(depth - creature.depth) < 150) {
            newlyDiscovered.add(creature.name);
          }
        });
        return newlyDiscovered;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMounted]);

  const bgColor = getBackgroundColor(currentDepth);
  const currentZone = getZone(currentDepth);

  // Determine which creatures are visible
  const visibleCreatures = sortedCreatures.filter(
    (c) => Math.abs(currentDepth - c.depth) < 200
  );

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ minHeight: `${totalScrollHeight}px` }}
    >
      {/* Background */}
      <div
        className="fixed inset-0 transition-colors duration-300"
        style={{ backgroundColor: bgColor }}
      />

      {/* Animated bubbles */}
      {isMounted && currentDepth < 3000 && <Bubbles />}

      {/* Depth Indicator */}
      {isMounted && <DepthIndicator depth={currentDepth} />}

      {/* Main Content - Zone title */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center pointer-events-none">
          <div className="mb-4">
            <h2
              className="text-xl md:text-2xl font-bold"
              style={{
                color:
                  currentDepth < 2000
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.5)",
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
                >
                  <CreatureCard creature={creature} isVisible={true} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Counter */}
      {isMounted && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-white/60">Creatures Found</div>
            <div className="text-lg font-bold text-blue-400">
              {discoveredCreatures.size} / {sortedCreatures.length}
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
            <h2 className="text-3xl font-bold text-white/90 mb-2">
              🏆 Challenger Deep
            </h2>
            <p className="text-white/60">11,034 meters — The deepest point on Earth</p>
          </div>
        </div>
      )}
    </div>
  );
}
