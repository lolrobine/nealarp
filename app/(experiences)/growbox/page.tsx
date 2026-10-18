"use client";

import { useMemo } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { useSavedProgress } from "@/lib/hooks/useSavedProgress";
import {
  applyPlacement,
  emptyState,
  growboxScore,
  isFinished,
  ITEMS,
  totalLevels,
  type ItemId,
} from "./logic";

function isItemId(value: unknown): value is ItemId {
  return typeof value === "string" && ITEMS.some((item) => item.id === value);
}

export default function GrowboxPage() {
  const record = usePersonalBest("growbox");
  const progress = useSavedProgress<ItemId[]>(
    "growbox",
    [],
    (value): value is ItemId[] => Array.isArray(value) && value.every(isItemId)
  );
  const state = useMemo(() => {
    let current = emptyState();
    for (const id of progress.value) current = applyPlacement(current, id);
    return current;
  }, [progress.value]);

  const finished = isFinished(state);
  const score = growboxScore(state);

  function place(id: ItemId) {
    if (isFinished(state) || state.placed.includes(id)) return;
    progress.save([...state.placed, id]);
    const next = applyPlacement(state, id);
    if (isFinished(next)) record.save(growboxScore(next));
  }

  function restart() {
    progress.clear();
  }

  return (
    <GameFrame
      id="growbox"
      title="Growbox"
      intro="It's not what you add to the greenhouse — it's when. Place all eight upgrades and read why each one grows."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">
            Total levels: {totalLevels(state)} / 16
            {finished ? ` · Score ${score.toFixed(1)} / 100` : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={restart}>
              Restart greenhouse
            </Button>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ITEMS.map((item) => {
            const placed = state.placed.includes(item.id);
            const level = state.levels[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={placed || finished}
                  onClick={() => place(item.id)}
                  className={`w-full h-full rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    placed
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "bg-[var(--secondary)] hover:border-[var(--ring)]"
                  }`}
                  aria-label={`Place ${item.name}${placed ? " (already placed)" : ""}`}
                >
                  <strong className="block">{item.name}</strong>
                  <span className="block text-xs text-[var(--muted-foreground)]">{item.blurb}</span>
                  <span className="mt-1 inline-block text-xs font-semibold">
                    {placed
                      ? `Lv ${level ?? 0} ${"★".repeat(level ?? 0)}${"☆".repeat(2 - (level ?? 0))}`
                      : "Not placed"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-2">Causal log</h2>
        <ul className="space-y-1 text-sm" aria-live="polite">
          {state.log.length === 0 ? (
            <li className="text-[var(--muted-foreground)]">
              Nothing yet. Place an upgrade to start the greenhouse.
            </li>
          ) : (
            state.log.map((line, i) => <li key={i}>{line}</li>)
          )}
        </ul>
      </Card>

      {finished && (
        <Card className="p-6 space-y-3 text-center">
          <h2 className="text-2xl font-bold">
            {score >= 99
              ? "Perfect greenhouse!"
              : score >= 70
                ? "A thriving greenhouse"
                : "The garden copes"}
          </h2>
          <p aria-live="polite">
            Final score: {score.toFixed(1)} / 100 · {totalLevels(state)} of 16 levels grown.
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {score < 100
              ? "Restart and reorder: every gain has a timing clue in the log."
              : "You found an order that keeps every upgrade growing."}
          </p>
          <Button onClick={restart}>Grow again</Button>
        </Card>
      )}

      <PersonalBest record={record} />
    </GameFrame>
  );
}
