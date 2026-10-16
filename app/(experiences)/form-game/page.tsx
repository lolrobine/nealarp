"use client";
import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { GameFrame } from "@/lib/components/games/GameFrame";
import { useSavedProgress } from "@/lib/hooks/useSavedProgress";
import { EMPTY_FORM, isFormProgress, PROMPTS, validateAnswer } from "./logic";
export default function FormGame() {
  const progress = useSavedProgress("form-game", EMPTY_FORM, isFormProgress);
  const { answers } = progress.value;
  const step = answers.length;
  const [input, setInput] = useState("");
  const [hint, setHint] = useState(false);
  const [reviewed, setReviewed] = useState<number | null>(null);
  const [error, setError] = useState("");
  function reset() {
    progress.clear();
    setReviewed(null);
    setInput("");
    setHint(false);
    setError("");
  }
  return (
    <GameFrame
      id="form-game"
      title="The Form Game"
      intro="Apply for a permit to apply for a permit. Bureaucracy has never been so personal."
    >
      <Card className="p-6 space-y-5">
        <p>Department of Unnecessary Approvals · Form 42-B</p>
        <progress className="w-full" value={step} max={10} aria-label="Completed form steps" />
        <p>{step} / 10 approvals</p>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[.2em] text-[var(--muted-foreground)]">
            Your approval passport · tap a stamp to review
          </p>
          <div className="grid grid-cols-5 gap-2">
            {PROMPTS.map((_, i) => (
              <button
                key={i}
                disabled={i >= step}
                aria-label={`Review approval ${i + 1}`}
                aria-pressed={reviewed === i}
                onClick={() => setReviewed(reviewed === i ? null : i)}
                className={`aspect-square rounded-xl border-2 text-lg font-bold transition-transform enabled:hover:-rotate-6 disabled:opacity-30 ${i < step ? "border-emerald-600 text-emerald-600 bg-emerald-500/10" : "border-dashed border-[var(--border)]"}`}
              >
                <span aria-hidden="true">{i < step ? "✓" : String(i + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          {reviewed !== null && reviewed < step && (
            <div className="rounded-lg bg-[var(--card)] p-3 text-sm">
              <p className="font-bold">
                Approval {reviewed + 1}: {PROMPTS[reviewed]![0]}
              </p>
              <p className="break-words">{answers[reviewed]}</p>
            </div>
          )}
        </div>
        <p>
          No time limit. Your answers are saved automatically in this browser only. Use a made-up
          name; do not enter sensitive information.
        </p>
        {step < 10 ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!validateAnswer(step, input, answers)) {
                setError(
                  "The department cannot approve this answer. Check the requirement or ask for a hint."
                );
                return;
              }
              progress.save({ answers: [...answers, input.trim()] });
              setInput("");
              setHint(false);
              setError("");
            }}
          >
            <label className="block font-bold" htmlFor="form-answer">
              {step + 1}. {PROMPTS[step]![0]}
            </label>
            <input
              id="form-answer"
              autoComplete="off"
              className="w-full rounded-lg border p-3 bg-[var(--background)]"
              value={input}
              maxLength={200}
              onChange={(e) => setInput(e.target.value)}
              aria-describedby="form-help"
            />
            <div id="form-help">{hint && <p>{PROMPTS[step]![1]}</p>}</div>
            <p role="alert">{error}</p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Request approval</Button>
              <Button type="button" variant="secondary" onClick={() => setHint((h) => !h)}>
                {hint ? "Hide hint" : "Show hint"}
              </Button>
            </div>
          </form>
        ) : (
          <div role="status" className="space-y-3">
            <h2 className="text-2xl font-bold">Permit granted!</h2>
            <p>You are now officially authorized to celebrate completing this authorization.</p>
          </div>
        )}
        {answers.length > 0 && (
          <details>
            <summary className="cursor-pointer">Your approved answers</summary>
            <ol className="list-decimal pl-6 break-words">
              {answers.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </details>
        )}
        <Button variant="secondary" onClick={reset}>
          Reset form and saved answers
        </Button>
        {progress.unavailable && (
          <p role="status">
            Storage is unavailable. You can finish this session, but it may not be restored after a
            reload.
          </p>
        )}
      </Card>
    </GameFrame>
  );
}
