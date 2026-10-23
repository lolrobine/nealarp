"use client";

import { useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { SegmentedControl } from "@/lib/components/ui/segmented-control";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { correctGateIndex, generateRound, scoreStreak, type Gate } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const PREVIEW_MS = [
  { id: "slow", label: "Practice pace (5s)", value: 5000 },
  { id: "normal", label: "Normal (3s)", value: 3000 },
  { id: "fast", label: "Fast (2s)", value: 2000 },
];

function gateLabel(gate: Gate): string {
  return `${gate.color} ${gate.shape} ${gate.number}`;
}

function gateColorClass(gate: Gate): string {
  if (gate.color === "amber") return "bg-amber-400 text-amber-950 border-amber-600";
  if (gate.color === "teal") return "bg-teal-400 text-teal-950 border-teal-600";
  return "bg-violet-400 text-violet-950 border-violet-600";
}

function gateShape(gate: Gate): string {
  return gate.shape === "circle" ? "●" : gate.shape === "square" ? "■" : "▲";
}

const isGateSpeed = (v: unknown): v is string => PREVIEW_MS.some((p) => p.id === v);
const isFlag = (v: unknown): v is boolean => typeof v === "boolean";

export default function GateCrashPage() {
  const record = usePersonalBest("gate-crash");
  const [seed] = useState(() => `gate-${Date.now()}`);
  const [roundNumber, setRoundNumber] = useState(0);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState<"preview" | "pick" | "over">("preview");
  const [feedback, setFeedback] = useState("");
  const [speedId, setSpeedId] = useLocalStorage<string>(
    "nealarp:settings:v1:gate-crash:speed",
    "normal",
    isGateSpeed
  );
  const [showRuleAlways, setShowRuleAlways] = useLocalStorage<boolean>(
    "nealarp:settings:v1:gate-crash:rule",
    false,
    isFlag
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = generateRound(seed, roundNumber);
  const previewMs = PREVIEW_MS.find((p) => p.id === speedId)?.value ?? 3000;
  // "Keep rule visible" is a display mode: skip the preview phase entirely.
  const effectivePhase: "preview" | "pick" | "over" =
    showRuleAlways && phase === "preview" ? "pick" : phase;
  const ruleVisible = showRuleAlways || effectivePhase === "preview";

  useEffect(() => {
    if (phase !== "preview" || showRuleAlways) return;
    timerRef.current = setTimeout(() => setPhase("pick"), previewMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, previewMs, showRuleAlways, roundNumber]);

  function pick(index: number) {
    if (effectivePhase !== "pick") return;
    const correct = correctGateIndex(round);
    if (index === correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setFeedback(`Correct — ${round.gates[index] ? gateLabel(round.gates[index]!) : ""} matched.`);
      setRoundNumber((n) => n + 1);
      setPhase("preview");
    } else {
      setFeedback(
        `Not quite — the rule matched ${round.gates[correct] ? gateLabel(round.gates[correct]!) : "another gate"}.`
      );
      setPhase("over");
      record.save(scoreStreak(streak));
    }
  }

  function restart() {
    setRoundNumber(0);
    setStreak(0);
    setFeedback("");
    setPhase("preview");
  }

  return (
    <GameFrame
      id="gate-crash"
      title="Gate Crash"
      intro="Study the rule while it is previewed, then crash the one gate it describes. Three gates, one winner, no second guesses."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SegmentedControl
            label="Preview"
            value={speedId}
            options={PREVIEW_MS.map((p) => ({ id: p.id, label: p.label }))}
            onChange={setSpeedId}
          />
          <Button
            variant={showRuleAlways ? "default" : "outline"}
            onClick={() => setShowRuleAlways(!showRuleAlways)}
            aria-pressed={showRuleAlways}
          >
            Keep rule visible
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Round {roundNumber + 1} · Streak {streak}
          </p>
          <p
            className={`mt-2 rounded-xl border border-[var(--border)] p-4 text-2xl font-bold ${
              ruleVisible ? "" : "blur-sm select-none"
            }`}
            aria-live="polite"
            aria-label={ruleVisible ? round.rule.text : "Rule hidden — memorised it"}
          >
            {ruleVisible ? round.rule.text : "Rule hidden"}
          </p>
          {effectivePhase === "preview" && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Previewing for {previewMs / 1000}s…
            </p>
          )}
        </div>

        <div className="board grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
          {round.gates.map((gate, i) => (
            <button
              key={i}
              type="button"
              disabled={effectivePhase !== "pick"}
              onClick={() => pick(i)}
              aria-label={`Gate ${i + 1}: ${gateLabel(gate)}`}
              className={`flex h-32 flex-col items-center justify-center gap-1 rounded-xl border-2 text-lg font-bold ${gateColorClass(
                gate
              )} ${effectivePhase === "pick" ? "hover:scale-[1.02] cursor-pointer" : "opacity-80"}`}
            >
              <span aria-hidden="true" className="text-3xl">
                {gateShape(gate)}
              </span>
              {gate.number}
            </button>
          ))}
        </div>

        {feedback && (
          <p className="text-center text-sm" aria-live="polite">
            {feedback}
          </p>
        )}

        {effectivePhase === "over" && (
          <WinScreen headline={`Streak of ${streak}`} score={scoreStreak(streak)}>
            <Button onClick={restart}>Play again</Button>
          </WinScreen>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Ten rules, ten crashes">
        <ExampleStep n={1}>
          The rule flashes first — read its key word (highest / even / circle / amber …) and ignore
          the near-miss gates that differ by exactly one property.
        </ExampleStep>
        <ExampleStep n={2}>
          Only one gate matches. Wrong crashes reset the streak; the ten rules are drawn from
          numbers, shapes and colours, one property at a time.
        </ExampleStep>
        <ExampleResult>Ten crashes in a row: 10 × streak = 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
