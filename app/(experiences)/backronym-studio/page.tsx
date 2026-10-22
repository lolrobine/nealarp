"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  CONSTRAINTS,
  coverage,
  coverageTrail,
  dailyLetters,
  scoreBackronym,
  splitWords,
  type ConstraintId,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

export default function BackronymStudioPage() {
  const record = usePersonalBest("backronym-studio");
  const [letters] = useState(() => dailyLetters());
  const [text, setText] = useState("");
  const [active, setActive] = useState<ConstraintId[]>(() => CONSTRAINTS.map((c) => c.id));

  const words = useMemo(() => splitWords(text), [text]);
  const score = useMemo(() => scoreBackronym(letters, text, active), [letters, text, active]);
  const covered = coverage(words, letters.toLowerCase());
  const trail = useMemo(() => coverageTrail(words, letters.toLowerCase()), [words, letters]);

  function toggleConstraint(id: ConstraintId) {
    setActive((list) => (list.includes(id) ? list.filter((c) => c !== id) : [...list, id]));
  }

  return (
    <GameFrame
      id="backronym-studio"
      title="Backronym Studio"
      intro="Write a phrase whose words spell a hidden word through their first letters. Pick your constraint cards — the rubric below is exactly how you are scored."
    >
      <Card className="p-6 space-y-4">
        <div>
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Today&apos;s hidden word. Each slot is claimed by the next word in your phrase that
            starts with that letter.
          </p>
          <ol
            className="mt-3 flex flex-wrap justify-center gap-2"
            aria-label={`Hidden word ${letters.toUpperCase().split("").join(" ")}`}
          >
            {letters.split("").map((letter, i) => {
              const word = trail[i];
              const isNext = !word && trail.slice(0, i).every(Boolean);
              return (
                <li
                  key={`${letter}-${i}`}
                  className={`flex min-w-[4.5rem] flex-col items-center rounded-xl border-2 px-2 py-2 ${
                    word
                      ? "border-amber-500/70 bg-amber-500/10"
                      : isNext
                        ? "border-dashed border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-dashed border-[var(--border)]"
                  }`}
                >
                  <span className="font-mono text-2xl font-bold uppercase leading-none">
                    {letter}
                  </span>
                  <span
                    className={`mt-1 max-w-[7rem] truncate text-xs ${
                      word ? "font-medium" : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {word ?? (isNext ? "write this word next" : "empty")}
                  </span>
                  <span className="sr-only">
                    {word
                      ? `claimed by ${word}`
                      : isNext
                        ? "next letter to claim"
                        : "not reached yet"}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]" aria-live="polite">
            Covered {covered} / {letters.length} letters in order
          </p>
        </div>

        <div>
          <label htmlFor="backronym-phrase" className="text-sm font-semibold">
            Your phrase
          </label>
          <textarea
            id="backronym-phrase"
            aria-describedby="backronym-phrase-hint"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Silent poets always rhyme, keeping…"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-3"
          />
          <p id="backronym-phrase-hint" className="text-xs text-[var(--muted-foreground)]">
            Words that do not match the next letter are still counted for the constraint cards.
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold">Constraint cards</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {CONSTRAINTS.map((card) => {
              const met = score.constraintsMet.includes(card.id);
              return (
                <label
                  key={card.id}
                  className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${
                    active.includes(card.id)
                      ? met
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-[var(--border)]"
                      : "border-dashed border-[var(--border)] opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active.includes(card.id)}
                    onChange={() => toggleConstraint(card.id)}
                    className="mt-1"
                  />
                  <span>
                    <strong>{card.label}</strong>
                    {active.includes(card.id) && (
                      <span aria-live="polite"> · {met ? "met" : "not yet"}</span>
                    )}
                    <br />
                    <span className="text-xs text-[var(--muted-foreground)]">{card.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="rounded-xl border border-[var(--border)] p-4" aria-live="polite">
          <p className="text-2xl font-bold">Live score: {score.total} / 100</p>
          <ul className="mt-2 grid gap-1 text-sm text-[var(--muted-foreground)] sm:grid-cols-3">
            <li>Letter coverage: {score.coveragePoints} / 40</li>
            <li>Constraints: {score.constraintPoints} / 30</li>
            <li>Quality: {score.qualityPoints} / 30</li>
          </ul>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Rubric: coverage 40 pts (target letters matched in order by word initials) + constraints
            30 pts (5 per active card) + quality 30 pts (average word length and 8-word comfort
            zone).
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => record.save(score.total)} disabled={words.length === 0}>
            Save this run
          </Button>
          <Button variant="outline" onClick={() => setText("")}>
            Clear
          </Button>
        </div>
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="A full-mark backronym">
        <ExampleStep n={1}>
          Pick constraint cards you can satisfy with your letter pool first — coverage is worth 40
          points and constraints another 30.
        </ExampleStep>
        <ExampleStep n={2}>
          Write the phrase for the rubric: every hidden-word letter needs its own word, in order.
          Then polish — wording quality is the last 30 points.
        </ExampleStep>
        <ExampleResult>
          Full coverage + every constraint + clean prose = 40 + 30 + 30 = 100.
        </ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
