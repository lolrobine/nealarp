"use client";
import { useState } from "react";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { Habitat, habitatTool, type HabitatKind } from "./Habitat";
import {
  INITIAL_ECOSYSTEM,
  TARGET_ROUNDS,
  ecosystemStep,
  isAlive,
  ecosystemScore,
  type Ecosystem,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";
export default function TinyEcosystem() {
  const [state, setState] = useState<Ecosystem>(INITIAL_ECOSYSTEM);
  const [actions, setActions] = useState(2);
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<Ecosystem[]>([]);
  const [message, setMessage] = useState("");
  const [habitatVersion, setHabitatVersion] = useState(0);
  const record = usePersonalBest("tiny-ecosystem:survival");
  const done = !isAlive(state) || state.round >= TARGET_ROUNDS;
  function adjust(key: "plants" | "herbivores" | "predators", amount: number) {
    if (actions <= 0 || done) return false;
    const max = key === "plants" ? 120 : key === "herbivores" ? 30 : 12;
    const next = Math.min(max, Math.max(0, state[key] + amount));
    if (next === state[key]) {
      setMessage("Already at the limit. No action spent.");
      return false;
    }
    setState({ ...state, [key]: next });
    setActions((a) => a - 1);
    setStarted(true);
    setMessage("Intervention applied.");
    if (next < 1) {
      record.save(ecosystemScore(state));
      setMessage("A population was lost. Restart to restore balance.");
    }
    return true;
  }
  function advance() {
    if (done) return;
    const simulated = ecosystemStep(state);
    // A failed turn is not a completed survival round.
    const next = isAlive(simulated) ? simulated : { ...simulated, round: state.round };
    setHistory((h) => [...h, state]);
    setState(next);
    setActions(2);
    setStarted(true);
    setMessage(
      isAlive(next)
        ? next.round === TARGET_ROUNDS
          ? "Twelve rounds of balance!"
          : "A new round begins. You have two interventions."
        : "A population was lost. The experiment has ended."
    );
    if (!isAlive(next) || next.round === TARGET_ROUNDS) record.save(ecosystemScore(next));
  }
  return (
    <GameFrame
      id="tiny-ecosystem"
      title="Tiny Ecosystem"
      intro="A small world, twelve rounds, and a delicate balance."
    >
      <Card className="p-6 space-y-5">
        <p>
          Keep all three populations at or above 1 for {TARGET_ROUNDS} rounds. You may make up to
          two interventions before advancing each round. Adding, removing, or planting costs one
          action. There is no timer.
        </p>
        <p>
          Round {state.round} / 12 · Interventions left: {actions}
        </p>
        <Habitat
          key={habitatVersion}
          state={state}
          disabled={done || actions === 0}
          onIntroduce={(kind: HabitatKind) => {
            const tool = habitatTool(kind);
            return adjust(tool.population, tool.amount);
          }}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["plants", "Plants", 120],
              ["herbivores", "Herbivores", 30],
              ["predators", "Predators", 12],
            ] as const
          ).map(([key, label, max]) => (
            <div key={key} className="rounded-xl bg-[var(--secondary)] p-4 space-y-3">
              <h2 className="font-bold">{label}</h2>
              <p className="text-3xl tabular-nums">{state[key].toFixed(1)}</p>
              <meter aria-label={label} className="w-full" min={0} max={max} value={state[key]} />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={done || actions === 0}
                  onClick={() => adjust(key, key === "plants" ? 10 : 1)}
                >
                  Add {key === "plants" ? 10 : 1} {label.toLowerCase()}
                </Button>
                {key !== "plants" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={done || actions === 0}
                    onClick={() => adjust(key, -1)}
                  >
                    Remove 1 {label.toLowerCase()}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled={done} onClick={advance}>
            Advance round
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setHabitatVersion((v) => v + 1);
              setState(INITIAL_ECOSYSTEM);
              setActions(2);
              setStarted(false);
              setHistory([]);
              setMessage("");
            }}
          >
            Restart ecosystem
          </Button>
        </div>
        <p role="status">
          {message}
          {done && ` Final score: ${ecosystemScore(state).toFixed(1)} / 100.`}
        </p>
        {started && (
          <details>
            <summary className="cursor-pointer">Population history</summary>
            <ul>
              {[...history, state].map((s, i) => (
                <li key={i}>
                  Round {s.round}: plants {s.plants.toFixed(1)}, herbivores{" "}
                  {s.herbivores.toFixed(1)}, predators {s.predators.toFixed(1)}
                </li>
              ))}
            </ul>
          </details>
        )}
        <details>
          <summary className="cursor-pointer">Model assumptions and scoring</summary>
          <p>
            Entirely fictional population units, including fractions. Per turn: plants gain 12 × (1
            − plants/120) and lose 0.55 per herbivore. Herbivores gain 1.4 if plants ≥ 20, otherwise
            lose 2, then lose 0.55 per predator. Predators gain 0.15 if prey ≥ three times predator
            population, otherwise lose 0.65. All changes use the previous state. Caps are 120, 30
            and 12. Score is completed rounds ÷ 12 × 100. This is a balancing game, not an
            ecological forecast.
          </p>
        </details>
      </Card>

      <HowToBeat summary="Four different opening moves all survive">
        <ExampleStep n={1}>
          The start is overgrazed on purpose: nineteen herbivores on twelve plants. Press Advance
          round and nothing else and the run collapses in round 6 — half marks.
        </ExampleStep>
        <ExampleStep n={2}>
          Plants lose 0.55 for every herbivore, and predators only grow while there are at least
          three herbivores for each of them. Both pressures point at the same number, which is why
          the herd can be fixed from either side: adding a herbivore keeps the predators fed,
          removing one eases the grazing.
        </ExampleStep>
        <ExampleStep n={3}>
          Of the five moves on the board, four save all twelve rounds when played before the very
          first Advance: plant ten, add a herbivore, remove a herbivore, or remove a predator.
          Adding a predator is the one that does not.
        </ExampleStep>
        <ExampleResult>
          Plant ten, then advance twelve times without touching anything else: 12 / 12 rounds, score
          100.
        </ExampleResult>
      </HowToBeat>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
