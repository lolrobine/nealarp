"use client";
import { localDayKey } from "@/lib/games/daily";
import { useEffect, useState } from "react";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Slider } from "@/lib/components/ui/slider";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { useSavedProgress } from "@/lib/hooks/useSavedProgress";
import {
  dailyColors,
  colorScore,
  PALETTE,
  rgb,
  EMPTY_HISTORY,
  isColorHistory,
  type RGB,
} from "./logic";

export default function ColorMemory() {
  const [phase, setPhase] = useState<"ready" | "look" | "blank" | "guess" | "result" | "done">(
    "ready"
  );
  const [dailyDay, setDailyDay] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [offset, setOffset] = useState(0);
  const [guess, setGuess] = useState<RGB>([128, 128, 128]);
  const [scores, setScores] = useState<number[]>([]);
  const record = usePersonalBest(
    dailyDay ? `color-memory:daily:${dailyDay}:v1` : "color-memory:five-rounds"
  );
  const history = useSavedProgress("color-memory:history", EMPTY_HISTORY, isColorHistory);
  const palette = dailyDay ? dailyColors(dailyDay) : PALETTE;
  const target = palette[(round + offset) % palette.length]!;
  useEffect(() => {
    if (phase !== "look" && phase !== "blank") return;
    const timeout = window.setTimeout(
      () => setPhase(phase === "look" ? "blank" : "guess"),
      phase === "look" ? 3000 : 1000
    );
    return () => clearTimeout(timeout);
  }, [phase]);
  useEffect(() => {
    function hidden() {
      if (document.hidden)
        setPhase((p) => (p === "look" || p === "blank" || p === "guess" ? "ready" : p));
    }
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  function restart() {
    setRound(0);
    setScores([]);
    setGuess([128, 128, 128]);
    setPhase("ready");
    setOffset(dailyDay ? 0 : Math.floor(Math.random() * PALETTE.length));
  }
  function submit() {
    const next = [...scores, colorScore(target, guess)];
    setScores(next);
    setPhase(round === 4 ? "done" : "result");
    if (round === 4) {
      const finalScore = next.reduce((a, b) => a + b, 0) / 5;
      record.save(finalScore);
      if (!dailyDay) history.save({ scores: [...history.value.scores, finalScore].slice(-10) });
    }
  }
  return (
    <GameFrame
      id="color-memory"
      title="Color Memory"
      intro="Look. Remember. Rebuild the color from memory."
    >
      <Card className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={dailyDay ? "secondary" : "default"}
            aria-pressed={!dailyDay}
            disabled={["look", "blank", "guess"].includes(phase)}
            onClick={() => {
              setDailyDay(null);
              setRound(0);
              setScores([]);
              setPhase("ready");
              setOffset(0);
            }}
          >
            Standard session
          </Button>
          <Button
            variant={dailyDay ? "default" : "secondary"}
            aria-pressed={!!dailyDay}
            disabled={["look", "blank", "guess"].includes(phase)}
            onClick={() => {
              setDailyDay(localDayKey());
              setRound(0);
              setScores([]);
              setPhase("ready");
              setOffset(0);
            }}
          >
            Play today&apos;s challenge
          </Button>
        </div>
        {dailyDay && (
          <p className="rounded-lg bg-[var(--primary)]/10 p-3 text-sm">
            Daily task · {dailyDay}. Five date-seeded colors, your own local record. The day is
            fixed for this session, even after midnight. No rankings or streak penalties.
          </p>
        )}
        <p>Round {round + 1} / 5</p>
        <p>
          Study the color for three seconds. After a one-second neutral pause, reconstruct it with
          RGB sliders. Hiding the tab cancels this round; start it again when ready.
        </p>
        {phase === "ready" && (
          <Button
            onClick={() => {
              setGuess([128, 128, 128]);
              setPhase("look");
            }}
          >
            Show color
          </Button>
        )}
        <div role="status">
          {phase === "look"
            ? "Remember this color…"
            : phase === "blank"
              ? "Keep it in mind…"
              : phase === "guess"
                ? "Recreate the color below."
                : phase === "done"
                  ? `Final score: ${(scores.reduce((a, b) => a + b, 0) / 5).toFixed(1)} / 100`
                  : ""}
        </div>
        {(phase === "look" || phase === "blank") && (
          <div
            aria-label={phase === "look" ? "Target color" : "Neutral pause"}
            className="h-48 rounded-xl border"
            style={{ background: phase === "look" ? rgb(target) : "#808080" }}
          />
        )}
        {phase === "guess" && (
          <>
            <label
              className="relative flex h-40 cursor-pointer items-end overflow-hidden rounded-xl border focus-within:ring-2 focus-within:ring-[var(--primary)]"
              style={{ background: rgb(guess) }}
            >
              <input
                type="color"
                aria-label="Mix a color"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={`#${guess.map((c) => c.toString(16).padStart(2, "0")).join("")}`}
                onChange={(e) =>
                  setGuess(
                    [1, 3, 5].map((i) => parseInt(e.target.value.slice(i, i + 2), 16)) as RGB
                  )
                }
              />
              <span className="pointer-events-none m-3 rounded-full bg-black/65 px-4 py-2 text-sm text-white">
                Tap to open the color mixer ↗
              </span>
            </label>
            {["Red", "Green", "Blue"].map((label, i) => (
              <Slider
                key={label}
                label={label}
                valueText={String(guess[i])}
                min={0}
                max={255}
                value={guess[i]}
                onChange={(e) => {
                  const next: RGB = [...guess];
                  next[i] = Number(e.target.value);
                  setGuess(next);
                }}
              />
            ))}
            <Button onClick={submit}>Submit color</Button>
          </>
        )}
        {(phase === "result" || phase === "done") && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>Target · {target.join(", ")}</p>
                <div className="h-32 rounded-xl border" style={{ background: rgb(target) }} />
              </div>
              <div>
                <p>Yours · {guess.join(", ")}</p>
                <div className="h-32 rounded-xl border" style={{ background: rgb(guess) }} />
              </div>
            </div>
            <p>Round score: {scores[round]?.toFixed(1)} / 100</p>
            <ol className="list-decimal pl-6">
              {scores.map((s, i) => (
                <li key={i}>
                  Round {i + 1}: {s.toFixed(1)} / 100
                </li>
              ))}
            </ol>
            {phase === "result" && (
              <Button
                onClick={() => {
                  setRound((r) => r + 1);
                  setPhase("ready");
                }}
              >
                Next color
              </Button>
            )}
          </>
        )}
        <Button variant="secondary" onClick={restart}>
          Restart
        </Button>
      </Card>
      <PersonalBest record={record} />
      <Card className="p-6 space-y-3">
        <h2 className="font-bold">Your last ten standard sessions</h2>
        {history.value.scores.length ? (
          <ol className="list-decimal pl-6">
            {history.value.scores.map((score, i) => (
              <li key={i}>{score.toFixed(1)} / 100</li>
            ))}
          </ol>
        ) : (
          <p>No session history yet.</p>
        )}
        <Button variant="secondary" onClick={history.clear}>
          Reset session history
        </Button>
        {history.unavailable && (
          <p role="status">Session history cannot be saved in this browser.</p>
        )}
      </Card>
      <p className="text-sm text-[var(--muted-foreground)]">
        Score: 100 × (1 − RGB distance / √(3 × 255²)); session score is the mean. This simple RGB
        metric is not perceptually uniform. Displays and color perception affect results. This
        color-dependent game is not a vision test.
      </p>
    </GameFrame>
  );
}
