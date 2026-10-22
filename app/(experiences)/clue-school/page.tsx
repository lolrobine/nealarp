"use client";

import { useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { ChoiceStrip } from "@/lib/components/games/ChoiceStrip";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { CLUES } from "./data";
import { isCorrect, scoreClues } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

export default function ClueSchoolPage() {
  const record = usePersonalBest("clue-school");
  const [clueIndex, setClueIndex] = useState(0);
  const level = CLUES[clueIndex] ?? CLUES[0]!;
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState(0);
  const [hints, setHints] = useState(0);
  const [solved, setSolved] = useState(false);

  function selectClue(index: number) {
    setClueIndex(index);
    setGuess("");
    setWrong(0);
    setHints(0);
    setSolved(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (solved || !guess.trim()) return;
    if (isCorrect(level, guess)) {
      setSolved(true);
      record.save(scoreClues(wrong, hints));
    } else {
      setWrong((n) => n + 1);
    }
  }

  return (
    <GameFrame
      id="clue-school"
      title="Clue School"
      intro="Every clue hides its answer inside honest wordplay. Guess the answer, or open the lesson to see exactly how the clue is built. All clues are original to this app."
    >
      <Card className="p-6 space-y-4">
        <ChoiceStrip label="Clues">
          {CLUES.map((c, i) => (
            <Button
              key={c.id}
              variant={i === clueIndex ? "default" : "outline"}
              onClick={() => selectClue(i)}
              aria-pressed={i === clueIndex}
            >
              Clue {i + 1}
            </Button>
          ))}
        </ChoiceStrip>

        <blockquote className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-6 text-xl">
          {level.clue} <span className="text-[var(--muted-foreground)]">{level.enumeration}</span>
        </blockquote>

        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <label className="flex-1 min-w-[200px]">
            <span className="sr-only">Your answer</span>
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={solved}
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 font-mono uppercase tracking-widest"
              placeholder="ANSWER"
              autoComplete="off"
            />
          </label>
          <Button type="submit" disabled={solved || !guess.trim()}>
            Check
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setHints((h) => h + 1)}
            disabled={hints >= 2 || solved}
          >
            Hint {hints + 1}/2
          </Button>
        </form>

        {wrong > 0 && !solved && (
          <p className="text-sm text-[var(--muted-foreground)]" aria-live="polite">
            {wrong} wrong attempt{wrong === 1 ? "" : "s"} — the clue is still fair.
          </p>
        )}
        {hints >= 1 && !solved && (
          <p className="text-sm" aria-live="polite">
            Device: <strong>{level.device}</strong>
          </p>
        )}
        {hints >= 2 && !solved && <p className="text-sm">{level.annotation}</p>}

        {solved && (
          <WinScreen
            headline={level.answer}
            score={scoreClues(wrong, hints)}
            detail={level.annotation}
          >
            {clueIndex + 1 < CLUES.length && (
              <Button onClick={() => selectClue(clueIndex + 1)}>Next clue</Button>
            )}
          </WinScreen>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Reading a clue like a lesson">
        <ExampleStep n={1}>
          The answer is hidden <em>inside</em> the clue&apos;s own words — split the surface text
          (&quot;train seat&quot; → &quot;in + seat&quot;) before inventing meanings.
        </ExampleStep>
        <ExampleStep n={2}>
          Stuck? Open the lesson before guessing: a hint costs 12 points, a wrong answer 8. Eight
          clues, eight clean answers.
        </ExampleStep>
        <ExampleResult>Eight straight answers: 100 − 8 × wrong − 12 × hints = 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
