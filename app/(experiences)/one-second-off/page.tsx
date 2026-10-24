"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { RecordExtras } from "@/lib/components/games/RecordExtras";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { average, timingResult } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

type Result = { elapsed: number; errorMs: number; score: number };
export default function OneSecondOff() {
  const [mode, setMode] = useState("session");
  const [target, setTarget] = useState(3);
  const [phase, setPhase] = useState<"ready" | "running" | "result" | "done">("ready");
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [visibleTime, setVisibleTime] = useState<number | null>(0);
  const [notice, setNotice] = useState("");
  const started = useRef<number | null>(null);
  const targets = mode === "session" ? [3, 7, 10] : [target];
  const currentTarget = targets[round] ?? target;
  const personal = usePersonalBest(`one-second-off:${mode === "session" ? "session" : target}`);

  useEffect(() => {
    function interrupt() {
      if (document.hidden && started.current !== null) {
        started.current = null;
        setPhase("ready");
        setVisibleTime(0);
        setNotice(
          "Round cancelled: the tab was hidden. No score was recorded. Try this round again."
        );
      }
    }
    document.addEventListener("visibilitychange", interrupt);
    return () => document.removeEventListener("visibilitychange", interrupt);
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    let frame = 0;
    function tick() {
      if (started.current === null) return;
      const elapsed = performance.now() - started.current;
      setVisibleTime(elapsed < 1000 ? elapsed : null);
      if (elapsed < 1000) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  function reset() {
    started.current = null;
    setPhase("ready");
    setRound(0);
    setResults([]);
    setVisibleTime(0);
    setNotice("");
  }
  function act() {
    if (phase === "ready") {
      started.current = performance.now();
      setNotice("");
      setVisibleTime(0);
      setPhase("running");
    } else if (phase === "running" && started.current !== null) {
      const elapsed = performance.now() - started.current;
      started.current = null;
      const next = [...results, { elapsed, ...timingResult(elapsed, currentTarget) }];
      setResults(next);
      if (round === targets.length - 1) {
        personal.save(average(next.map((r) => r.score)));
        setPhase("done");
      } else setPhase("result");
    }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
      <header className="text-center space-y-3">
        <p className="text-sm uppercase tracking-widest">Singleplayer · Time perception</p>
        <h1 className="text-4xl font-bold">One Second Off</h1>
        <p>Feel the time. Stop as close to the target as you can.</p>
      </header>
      <Card className="p-6 space-y-5">
        <label className="block">
          Mode{" "}
          <select
            className="ml-3 rounded border p-2 bg-[var(--background)]"
            aria-label="Mode"
            value={mode}
            disabled={phase !== "ready" || results.length > 0}
            onChange={(e) => {
              setMode(e.target.value);
              reset();
            }}
          >
            <option value="session">Three rounds · 3 / 7 / 10 seconds</option>
            <option value="single">Single round</option>
          </select>
        </label>
        {mode === "single" && (
          <label className="block">
            Target{" "}
            <select
              className="ml-3 rounded border p-2 bg-[var(--background)]"
              aria-label="Target"
              value={target}
              disabled={phase !== "ready"}
              onChange={(e) => setTarget(Number(e.target.value))}
            >
              {[3, 7, 10].map((t) => (
                <option key={t} value={t}>
                  {t} seconds
                </option>
              ))}
            </select>
          </label>
        )}
        <p>
          Round {round + 1} / {targets.length} · Target: <strong>{currentTarget} seconds</strong>
        </p>
        <button
          className={`relative mx-auto grid h-60 w-60 place-content-center rounded-full border-[10px] text-center font-mono text-5xl tabular-nums shadow-inner transition-colors ${phase === "running" ? "border-sky-400 bg-sky-500/10" : "border-[var(--primary)]/30 bg-[var(--secondary)]"} disabled:cursor-default`}
          disabled={phase !== "ready" && phase !== "running"}
          aria-label={
            phase === "running"
              ? "Timer pad — stop"
              : phase === "ready"
                ? "Timer pad — start"
                : `Round result: ${((results.at(-1)?.elapsed ?? 0) / 1000).toFixed(3)} seconds`
          }
          onClick={act}
        >
          <span aria-hidden="true">
            {phase === "running"
              ? visibleTime === null
                ? "?.???"
                : (visibleTime / 1000).toFixed(3)
              : phase === "result" || phase === "done"
                ? ((results.at(-1)?.elapsed ?? 0) / 1000).toFixed(3)
                : `${currentTarget}.000`}
          </span>
          <span
            className="mt-3 text-xs uppercase tracking-[.25em] text-[var(--muted-foreground)]"
            aria-hidden="true"
          >
            {phase === "running"
              ? "Tap to stop"
              : phase === "ready"
                ? "Tap to start"
                : "Round complete"}
          </span>
        </button>
        <p>
          The clock disappears after one second. Use the button with touch, Enter or Space. Leaving
          this tab cancels the current attempt.
        </p>
        {(phase === "ready" || phase === "running") && (
          <Button className="w-full" onClick={act}>
            {phase === "running" ? "Stop timer" : "Start timer"}
          </Button>
        )}
        {phase === "result" && (
          <Button
            onClick={() => {
              setRound((r) => r + 1);
              setVisibleTime(0);
              setPhase("ready");
            }}
          >
            Next round
          </Button>
        )}
        <p role="status">{notice}</p>
        <div>
          {results.length > 0 && (
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i}>
                  Round {i + 1}: {(r.elapsed / 1000).toFixed(3)} s · off by {Math.round(r.errorMs)}{" "}
                  ms · {r.score.toFixed(1)} / 100
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--secondary)]"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${r.score}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {phase === "done" && (
            <p className="text-xl font-bold mt-4" role="status">
              Final score: {average(results.map((r) => r.score)).toFixed(1)} / 100
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={reset}>
          Restart
        </Button>
      </Card>
      <Card className="p-6 space-y-3">
        <h2 className="font-bold">Your personal best</h2>
        <p>
          {personal.best === null
            ? "No completed attempt in this mode yet."
            : `${personal.best.toFixed(1)} / 100`}
        </p>
        <Button variant="secondary" onClick={personal.clear}>
          Reset best for this mode
        </Button>
        <RecordExtras record={personal} />
        {personal.unavailable && (
          <p role="status">
            Browser storage is unavailable. You can still play; records may not be saved.
          </p>
        )}
      </Card>
      <HowToBeat summary="Where the points actually are">
        <ExampleStep n={1}>
          The clock runs visibly for one second and then hides. That first second is the only
          calibration you get, so watch it rather than looking away — count the rest against it.
        </ExampleStep>
        <ExampleStep n={2}>
          Error is measured against the target, not in absolute time, so the same slip is worth
          wildly different amounts. Half a second out costs 5 points on the 10-second round and 16.7
          on the 3-second one. Spend your concentration on the short round; the long one forgives.
        </ExampleStep>
        <ExampleStep n={3}>
          Even a bad round pays. A whole second out on the 3-second target still scores 66.7, so
          finish the session rather than restarting after one miss.
        </ExampleStep>
        <ExampleResult>
          Land within 5 per cent of each target — 3.15 s, 7.35 s, 10.5 s — and every round scores
          95, for a session mean of 95 / 100.
        </ExampleResult>
      </HowToBeat>

      <p className="text-sm text-[var(--muted-foreground)]">
        Scoring: 100 × (1 − absolute error / target time), minimum 0; a session uses the mean of its
        rounds. Records stay in this browser. This is a game, not a scientific performance test:
        input and device delays affect results.
      </p>
    </div>
  );
}
