"use client";
import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { localDayKey } from "@/lib/games/daily";
import { QUESTIONS, isCorrect, dailyQuestions } from "./logic";
export default function WhichIsMore() {
  const [dailyDay, setDailyDay] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [practice, setPractice] = useState(false);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<"left" | "right" | null>(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const questions = dailyDay
    ? dailyQuestions(dailyDay)
    : QUESTIONS.filter((q) => category === "all" || q.category === category);
  const q = questions[index % questions.length]!;
  const done = !practice && choice !== null && index === questions.length - 1;
  const record = usePersonalBest(
    dailyDay ? `which-is-more:daily:${dailyDay}:v1` : `which-is-more:${category}`
  );
  const streakRecord = usePersonalBest(
    dailyDay ? `which-is-more:daily:${dailyDay}:v1:streak` : `which-is-more:${category}:streak`
  );
  function reset() {
    setIndex(0);
    setChoice(null);
    setPoints(0);
    setStreak(0);
    setBestStreak(0);
  }
  function choose(side: "left" | "right") {
    if (choice !== null) return;
    const correct = isCorrect(q, side);
    const next = points + Number(correct);
    setPoints(next);
    setChoice(side);
    const run = correct ? streak + 1 : 0;
    setStreak(run);
    setBestStreak(Math.max(bestStreak, run));
    if (!practice) streakRecord.save(run);
    if (!practice && index === questions.length - 1) record.save((next / questions.length) * 100);
  }
  return (
    <GameFrame
      id="which-is-more"
      title="Which Is More?"
      intro="Compare, calculate, and build your own streak."
    >
      <Card
        className="p-6 space-y-5"
        tabIndex={0}
        aria-label="Comparison quiz"
        onKeyDown={(e) => {
          if ((e.target as HTMLElement).closest("input,select,textarea")) return;
          if (e.key === "1") {
            e.preventDefault();
            choose("left");
          }
          if (e.key === "2") {
            e.preventDefault();
            choose("right");
          }
        }}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant={dailyDay ? "secondary" : "default"}
            aria-pressed={!dailyDay}
            onClick={() => {
              setDailyDay(null);
              reset();
            }}
          >
            Standard quiz
          </Button>
          <Button
            variant={dailyDay ? "default" : "secondary"}
            aria-pressed={!!dailyDay}
            onClick={() => {
              setDailyDay(localDayKey());
              setCategory("all");
              setPractice(false);
              reset();
            }}
          >
            Play today&apos;s challenge
          </Button>
        </div>
        {dailyDay && (
          <p className="rounded-lg bg-[var(--primary)]/10 p-3 text-sm">
            Daily task · {dailyDay}. Ten date-seeded comparisons with shuffled order and sides. This
            session keeps its day after midnight. Personal records only; no rankings or missed-day
            penalties.
          </p>
        )}
        <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
          Click a card · or focus this panel and press 1 / 2
        </p>
        <p>
          These are fictional lab scenarios with exact, supplied measurements—not animal records or
          real vehicle specifications. Compare speed, area or volume using the numbers shown.
        </p>
        <label className="block">
          Category{" "}
          <select
            className="rounded border p-2 bg-[var(--background)]"
            aria-label="Category"
            disabled={!!dailyDay}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              reset();
            }}
          >
            <option value="all">Mixed · 10 questions</option>
            <option value="speed">Speed · 5 questions</option>
            <option value="size">Size · 5 questions</option>
          </select>
        </label>
        <label className="flex gap-3">
          <input
            type="checkbox"
            disabled={!!dailyDay}
            checked={practice}
            onChange={(e) => {
              setPractice(e.target.checked);
              reset();
            }}
          />
          Practice mode (unlimited, no record)
        </label>
        <p>
          {practice
            ? `Practice question ${index + 1}`
            : `Question ${index + 1} / ${questions.length}`}{" "}
          · Best streak this run: {bestStreak}
        </p>
        <h2 className="text-2xl font-bold">
          Which{" "}
          {q.category === "speed"
            ? "moves faster"
            : "has the larger " + (q.explanation.includes("cubic") ? "volume" : "area")}
          ?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            className="h-auto min-h-24 whitespace-normal p-5"
            disabled={choice !== null}
            aria-label={q.left}
            aria-pressed={choice === "left"}
            onClick={() => choose("left")}
          >
            <span
              aria-hidden="true"
              className="mr-3 rounded-full border border-white/40 px-2 py-1 text-xs"
            >
              1
            </span>
            {q.left}
          </Button>
          <Button
            className="h-auto min-h-24 whitespace-normal p-5"
            disabled={choice !== null}
            aria-label={q.right}
            aria-pressed={choice === "right"}
            onClick={() => choose("right")}
          >
            <span
              aria-hidden="true"
              className="mr-3 rounded-full border border-white/40 px-2 py-1 text-xs"
            >
              2
            </span>
            {q.right}
          </Button>
        </div>
        {choice !== null && (
          <div
            className="space-y-3 rounded-xl bg-[var(--secondary)] p-4"
            aria-label="Answer comparison"
          >
            <p className="text-xs uppercase tracking-widest">The numbers, side by side</p>
            {[
              [q.left, q.a],
              [q.right, q.b],
            ].map(([label, value], i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs">
                  {String(label)} → {value}
                </p>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--background)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500"
                    style={{ width: `${(Number(value) / Math.max(q.a, q.b)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <div role="status">
          {choice !== null && (
            <>
              <p className="font-bold">{isCorrect(q, choice) ? "Correct!" : "Not this time."}</p>
              <p>{q.explanation}</p>
              {done && <p>Final score: {((points / questions.length) * 100).toFixed(1)} / 100</p>}
            </>
          )}
        </div>
        {choice !== null && !done && (
          <Button
            onClick={() => {
              setIndex((i) => i + 1);
              setChoice(null);
            }}
          >
            Next question
          </Button>
        )}
        <Button variant="secondary" onClick={reset}>
          Restart
        </Button>
        <p className="text-sm">
          One correct answer earns one point; final score is the percentage correct. Practice
          repeats the question set.
        </p>
      </Card>
      <PersonalBest record={record} />
      <Card className="p-6 space-y-3">
        <h2 className="font-bold">Your longest quiz streak</h2>
        <p>
          {streakRecord.best === null
            ? "No quiz answers yet."
            : `${streakRecord.best} correct in a row · ${category} category`}
        </p>
        <Button variant="secondary" onClick={streakRecord.clear}>
          Reset longest streak
        </Button>
        {streakRecord.unavailable && (
          <p role="status">Your streak cannot be saved in this browser.</p>
        )}
      </Card>
    </GameFrame>
  );
}
