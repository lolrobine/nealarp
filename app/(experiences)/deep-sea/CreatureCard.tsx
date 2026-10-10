"use client";

import { useState } from "react";
import type { Creature } from "./data";

interface CreatureCardProps {
  creature: Creature;
  isVisible: boolean;
}

export function CreatureCard({ creature, isVisible }: CreatureCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {isVisible && (
        <div
          onClick={() => setExpanded(!expanded)}
          className="bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] rounded-xl p-4 cursor-pointer hover:border-[var(--primary)]/50 transition-all shadow-lg max-w-xs"
        >
          <div className="flex items-start gap-3">
            <div className="text-4xl">{creature.emoji}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-[var(--foreground)]">
                {creature.name}
              </h3>
              <p className="text-xs text-[var(--primary)] font-mono">
                {creature.depth.toLocaleString()}m deep
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                {creature.description}
              </p>
            </div>
          </div>

          {expanded && creature.funFact && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)]">
                💡 <span className="text-[var(--foreground)]">{creature.funFact}</span>
              </p>
            </div>
          )}

          {creature.funFact && !expanded && (
            <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
              Click to learn more →
            </p>
          )}
        </div>
      )}
    </>
  );
}
