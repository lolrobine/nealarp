"use client";

import { creatureShape, Picto } from "@/lib/components/games/Picto";
import { useState, memo } from "react";
import type { Creature } from "./data";

interface CreatureCardProps {
  creature: Creature;
  isVisible: boolean;
}

function CreatureCardComponent({ creature, isVisible }: CreatureCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${creature.name} at ${creature.depth} meters, ${creature.description}`}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
      className="bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] rounded-xl p-4 cursor-pointer hover:border-[var(--primary)]/50 transition-all shadow-lg max-w-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <div className="flex items-start gap-3">
        <Picto name={creatureShape(creature.name)} size={36} className="text-[var(--primary)]" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-[var(--foreground)]">{creature.name}</h3>
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
            <Picto name="bulb" size={13} />{" "}
            <span className="text-[var(--foreground)]">{creature.funFact}</span>
          </p>
        </div>
      )}

      {creature.funFact && !expanded && (
        <p className="text-[10px] text-[var(--muted-foreground)] mt-2">Click to learn more →</p>
      )}
    </div>
  );
}

export const CreatureCard = memo(CreatureCardComponent);
