"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

export function Confetti({ active }: { active: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  return active && !reducedMotion ? <ConfettiBurst /> : null;
}

function ConfettiBurst() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>(() => {
    const colors = ["#6366f1", "#22c55e", "#06b6d4", "#f59e0b", "#ef4444"];
    return Array.from({ length: 30 }, (_, id) => ({
      id,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      delay: Math.random() * 0.5,
      duration: 1 + Math.random() * 1.5,
      size: 6 + Math.random() * 8,
    }));
  });
  useEffect(() => {
    const timer = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg) translateX(0); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg) translateX(100px); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
