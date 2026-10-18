"use client";

import { useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { CLUES } from "./data";
import { isCorrect, scoreClues } from "./logic";

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
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Clues">
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
        </div>

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
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">
              {level.answer} · {scoreClues(wrong, hints)} / 100
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">{level.annotation}</p>
            {clueIndex + 1 < CLUES.length && (
              <Button className="mt-2" onClick={() => selectClue(clueIndex + 1)}>
                Next clue
              </Button>
            )}
          </div>
        )}
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
