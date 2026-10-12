"use client";

import { motion } from "framer-motion";
import { MAX_DEPTH, getZone } from "./data";

interface DepthIndicatorProps {
  depth: number;
}

export function DepthIndicator({ depth }: DepthIndicatorProps) {
  const zone = getZone(depth) ?? { name: "Unknown" };
  const progress = (depth / MAX_DEPTH) * 100;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2">
      {/* Depth Number */}
      <div
        className="bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] rounded-xl px-3 py-2 text-center shadow-lg"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="text-xs text-[var(--muted-foreground)]">Depth</div>
        <div className="text-lg font-bold text-[var(--primary)]">
          {Math.round(depth).toLocaleString()}m
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-2 h-48 bg-[var(--secondary)] rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 right-0 bg-gradient-to-b from-blue-400 to-blue-900 rounded-full"
          animate={{ height: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
        {/* Creature markers */}
        <div className="absolute inset-0">
          {[0.02, 0.1, 0.3, 0.6, 1.0].map((pos, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-white/20"
              style={{ top: `${pos * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Zone Name */}
      <div className="bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] rounded-lg px-2 py-1 text-center">
        <div className="text-[10px] text-[var(--muted-foreground)]">{zone.name}</div>
      </div>
    </div>
  );
}
