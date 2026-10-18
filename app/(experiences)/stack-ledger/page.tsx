"use client";

import { useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  canDrop,
  dropBlock,
  newRun,
  scoreTower,
  swingX,
  WIN_HEIGHT,
  type StackState,
} from "./logic";

const SPEEDS = [
  { id: "slow", label: "Practice pace", factor: 0.6 },
  { id: "normal", label: "Normal", factor: 1 },
  { id: "fast", label: "Fast", factor: 1.6 },
];

export default function StackLedgerPage() {
  const record = usePersonalBest("stack-ledger");
  const [speedId, setSpeedId] = useState("normal");
  const [state, setState] = useState<StackState>(() => newRun(`stack-${Date.now()}`));
  const [practice, setPractice] = useState(false);
  const tickRef = useRef(state.tick);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const speedRef = useRef(1);

  useEffect(() => {
    const factor = SPEEDS.find((s) => s.id === speedId)?.factor ?? 1;
    speedRef.current = factor;
  }, [speedId]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      if (state.alive) {
        tickRef.current += (dt / 16.7) * speedRef.current;
        const x = swingX(tickRef.current);
        if (blockRef.current) blockRef.current.style.left = `calc(${(x * 100).toFixed(3)}% - 13%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state.alive]);

  function drop() {
    const withTick: StackState = { ...state, tick: tickRef.current };
    const gate = canDrop(withTick);
    if (!gate.ok) return;
    const next = dropBlock(withTick);
    tickRef.current = next.tick;
    setState(next);
    if (!next.alive && !practice) record.save(scoreTower(next.placed.length));
    if (next.placed.length >= WIN_HEIGHT && !practice) record.save(100);
  }

  const gate = canDrop(state);
  const height = state.placed.length;

  return (
    <GameFrame
      id="stack-ledger"
      title="Stack Ledger"
      intro="Drop the swinging block onto the tower. House rule: a block's number may never exceed the number below it. Land off-centre and everything comes down."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SPEEDS.map((s) => (
            <Button
              key={s.id}
              variant={speedId === s.id ? "default" : "outline"}
              onClick={() => setSpeedId(s.id)}
              aria-pressed={speedId === s.id}
            >
              {s.label}
            </Button>
          ))}
          <Button
            variant={practice ? "default" : "outline"}
            onClick={() => setPractice(!practice)}
            aria-pressed={practice}
          >
            Practice (unscored)
          </Button>
        </div>

        <div
          className="relative mx-auto overflow-hidden rounded-xl border border-[var(--border)] bg-sky-100/60"
          style={{ width: "min(92vw, 360px)", height: "min(70vw, 420px)" }}
          role="img"
          aria-label={`Tower height ${height} blocks. Next block number ${state.nextN}. ${state.alive ? "Tower standing." : "Tower fallen."}`}
        >
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-stone-400" />
          {state.placed.map((block, i) => (
            <div
              key={i}
              className="absolute flex items-center justify-center rounded-md border border-amber-700 bg-amber-400 text-sm font-bold text-amber-950"
              style={{
                left: `calc(${(block.x * 100).toFixed(3)}% - 13%)`,
                bottom: `${12 + i * 20}px`,
                width: "26%",
                height: "18px",
              }}
            >
              {block.n}
            </div>
          ))}
          {state.alive && (
            <div
              ref={blockRef}
              className="absolute flex items-center justify-center rounded-md border border-amber-700 bg-amber-300 text-sm font-bold text-amber-950"
              style={{
                left: `calc(${(swingX(state.tick) * 100).toFixed(3)}% - 13%)`,
                bottom: `${12 + height * 20}px`,
                width: "26%",
                height: "18px",
              }}
            >
              {state.nextN}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]" aria-live="polite">
          Height: <strong>{height}</strong> / {WIN_HEIGHT} blocks
          {state.alive ? "" : " · Tower fell — score saved."}
          {!gate.ok ? ` · ${gate.reason}` : ""}
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={drop} disabled={!state.alive || !gate.ok}>
            Drop block {state.nextN}
          </Button>
          <Button variant="outline" onClick={() => setState(newRun(`stack-${Date.now()}`))}>
            New tower
          </Button>
        </div>

        <p className="text-xs text-[var(--muted-foreground)]">
          The pendulum is simulated in fixed steps, so drop timing — not frame rate — decides where
          blocks land. Next block numbers follow a deterministic per-tower sequence.
        </p>
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
