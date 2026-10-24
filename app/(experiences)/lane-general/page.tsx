"use client";

import { useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  enemyLineup,
  resolveFight,
  scoreStreak,
  UNITS,
  type FightResult,
  type Lineup,
  type Unit,
  DRAFT_SIZE,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const ROUNDS = 5;
const TRAIT_TEXT: Record<Unit["trait"], string> = {
  swift: "Swift: +1 damage on its first strike",
  sturdy: "Sturdy: first hit taken is halved",
  jolly: "Jolly: +1 damage while hurt",
};

export default function LaneGeneralPage() {
  const record = usePersonalBest("lane-general");
  const [seed, setSeed] = useState(() => `lane-general:${Date.now()}`);
  const [picked, setPicked] = useState<Unit[]>([]);
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [fight, setFight] = useState<FightResult | null>(null);
  const finished = round >= ROUNDS;

  function toggleUnit(unit: Unit) {
    if (fight) return;
    if (picked.some((u) => u.id === unit.id)) {
      setPicked(picked.filter((u) => u.id !== unit.id));
    } else if (picked.length < DRAFT_SIZE) {
      setPicked([...picked, unit]);
    }
  }

  /**
   * Lane order decides the fight — the resolver walks the lanes in order and
   * How to beat it tells players to reorder. Before this there was no way to
   * see the order, let alone change it, short of dropping units and picking
   * them again in the right sequence.
   */
  function moveUnit(index: number, delta: number) {
    const target = index + delta;
    if (fight || target < 0 || target >= picked.length) return;
    const next = [...picked];
    const a = next[index]!;
    next[index] = next[target]!;
    next[target] = a;
    setPicked(next);
  }

  function restart() {
    setSeed(`lane-general:${Date.now()}`);
    setPicked([]);
    setRound(0);
    setStreak(0);
    setFight(null);
  }

  function battle() {
    if (picked.length !== DRAFT_SIZE || fight) return;
    const lineup = picked as Lineup;
    const enemy = enemyLineup(seed, round);
    const result = resolveFight(lineup, enemy);
    setFight(result);
    if (result.winner === "player") {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (round + 1 >= ROUNDS) record.save(scoreStreak(nextStreak, ROUNDS));
    } else {
      if (round + 1 >= ROUNDS) record.save(scoreStreak(streak, ROUNDS));
    }
  }

  function nextRound() {
    setRound(round + 1);
    setPicked([]);
    setFight(null);
  }

  return (
    <GameFrame
      id="lane-general"
      title="Lane General"
      intro="Draft three units, then watch the deterministic right-to-left resolver settle the fight. Same line-ups, same outcome — win with stats, not luck (inspired by Super Auto Pets; original units)."
    >
      <Card className="p-6 space-y-4">
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Round {Math.min(round + 1, ROUNDS)} of {ROUNDS} · Rounds won {streak} of {ROUNDS}
        </p>

        <div>
          <h2 className="font-bold">Draft (pick three)</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {UNITS.map((unit) => {
              const isPicked = picked.some((u) => u.id === unit.id);
              return (
                <button
                  key={unit.id}
                  type="button"
                  disabled={Boolean(fight) || (!isPicked && picked.length >= DRAFT_SIZE)}
                  onClick={() => toggleUnit(unit)}
                  aria-pressed={isPicked}
                  className={`rounded-lg border p-3 text-left ${
                    isPicked ? "border-amber-500 bg-amber-500/10" : "border-[var(--border)]"
                  }`}
                >
                  <p className="font-bold">
                    {unit.name} · Atk {unit.attack} · HP {unit.health}
                    {isPicked ? ` · Lane ${picked.findIndex((u) => u.id === unit.id) + 1}` : ""}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{TRAIT_TEXT[unit.trait]}</p>
                </button>
              );
            })}
          </div>
        </div>

        {picked.length > 0 && (
          <div>
            <h2 className="font-bold">Lane order (front fights first)</h2>
            <ol className="mt-2 space-y-2" aria-label="Lane order">
              {picked.map((unit, i) => (
                <li
                  key={unit.id}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2"
                >
                  <span className="text-sm font-bold">Lane {i + 1}</span>
                  <span className="grow text-sm">
                    {unit.name} · Atk {unit.attack} · HP {unit.health}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveUnit(i, -1)}
                    disabled={i === 0 || Boolean(fight)}
                    aria-label={`Move ${unit.name} one lane forward`}
                    className="h-9 w-9 rounded-lg border border-[var(--border)] disabled:opacity-40"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => moveUnit(i, 1)}
                    disabled={i === picked.length - 1 || Boolean(fight)}
                    aria-label={`Move ${unit.name} one lane back`}
                    className="h-9 w-9 rounded-lg border border-[var(--border)] disabled:opacity-40"
                  >
                    &darr;
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex justify-center gap-2">
          <Button
            onClick={battle}
            disabled={picked.length !== DRAFT_SIZE || Boolean(fight) || finished}
          >
            {finished ? "Campaign over" : `Fight round ${round + 1}`}
          </Button>
          <Button variant="outline" onClick={() => setPicked([])} disabled={Boolean(fight)}>
            Redraft
          </Button>
        </div>

        {fight && (
          <div className="rounded-xl border border-[var(--border)] p-4" aria-live="polite">
            <p className="text-xl font-bold">
              {fight.winner === "player"
                ? "Victory!"
                : fight.winner === "enemy"
                  ? "Defeat."
                  : "Draw."}
            </p>
            <ol
              className="mt-2 list-decimal pl-5 text-sm text-[var(--muted-foreground)]"
              aria-label="Fight log"
            >
              {fight.steps.map((step, i) => (
                <li key={i}>
                  {step.attacker} hits {step.target} for {step.damage} → {step.targetHealthLeft} ♥
                  left
                </li>
              ))}
            </ol>
            <Button className="mt-2" onClick={nextRound} disabled={finished && round >= ROUNDS}>
              {round + 1 >= ROUNDS ? "See final score" : "Next round"}
            </Button>
          </div>
        )}

        {finished && (
          <WinScreen
            headline="Campaign over"
            score={scoreStreak(streak, ROUNDS)}
            detail={`Rounds won: ${streak} of ${ROUNDS}.`}
          >
            <Button onClick={restart}>New campaign</Button>
          </WinScreen>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="A draft that almost always wins">
        <ExampleStep n={1}>
          Draft Tuck + Moss + Cheep. Over the pure resolver&apos;s full space of 504 ordered enemy
          trios, this line-up wins 501 and never draws — the two sturdy units absorb the first
          exchange and Cheep&apos;s jolly bonus finishes the last enemy.
        </ExampleStep>
        <ExampleStep n={2}>
          Exactly three trios beat it, and all three lead with Cheep then Tuck: Cheep + Tuck +
          Bumble, Cheep + Tuck + Moss and Cheep + Tuck + Waddle. Against that opening, keep the same
          three units but reorder to Tuck + Cheep + Moss — lane order alone turns all three losses
          into wins.
        </ExampleStep>
        <ExampleResult>Five straight round wins → score = streak / 5 × 100 = 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
