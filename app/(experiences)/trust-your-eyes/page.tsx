"use client";

import { useRef, useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { RecordExtras } from "@/lib/components/games/RecordExtras";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { average } from "../one-second-off/logic";
import { TASKS, visualResult } from "./logic";

export default function TrustYourEyes() {
  const [round, setRound] = useState(0);
  const [x, setX] = useState(20);
  const [y, setY] = useState(25);
  const [scores, setScores] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const dragging = useRef(false);
  const task = TASKS[round]!;
  const done = submitted && round === TASKS.length - 1;
  const result = visualResult(task, x, y);
  const personal = usePersonalBest("trust-your-eyes:session");
  function reset() {
    setRound(0);
    setX(20);
    setY(25);
    setScores([]);
    setSubmitted(false);
  }
  function submit() {
    if (submitted) return;
    const next = [...scores, result.score];
    setScores(next);
    setSubmitted(true);
    if (round === TASKS.length - 1) personal.save(average(next));
  }
  const angle = (task.target * Math.PI) / 180;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
      <header className="text-center space-y-3">
        <p className="text-sm uppercase tracking-widest">Singleplayer · Visual precision</p>
        <h1 className="text-4xl font-bold">Trust Your Eyes</h1>
        <p>Six small challenges. How accurate is your intuition?</p>
      </header>
      <Card className="p-6 space-y-5">
        <p>
          Round {round + 1} / {TASKS.length}
        </p>
        <h2 className="text-2xl font-bold">
          {task.kind === "line"
            ? "Split the line into two equal halves"
            : task.kind === "center"
              ? "Find the center of the rectangle"
              : "Estimate the angle"}
        </h2>
        <p>
          {task.kind === "angle"
            ? "Use the slider to estimate the angle shown, from 0° to 180°."
            : "Tap or drag the marker, or use the sliders and arrow keys. Slider values are hidden until you submit."}
        </p>
        <svg
          viewBox="0 0 400 240"
          role="img"
          aria-label={task.kind === "angle" ? "Angle to estimate" : "Adjustable estimate diagram"}
          className="w-full rounded-xl bg-[var(--secondary)] select-none"
          style={{ touchAction: task.kind === "angle" ? "auto" : "none" }}
          onPointerDown={(e) => {
            if (submitted || task.kind === "angle") return;
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            const b = e.currentTarget.getBoundingClientRect();
            setX(
              Math.max(
                0,
                Math.min(100, ((((e.clientX - b.left) / b.width) * 400 - 40) / 320) * 100)
              )
            );
            setY(
              Math.max(
                0,
                Math.min(100, ((((e.clientY - b.top) / b.height) * 240 - 40) / 160) * 100)
              )
            );
          }}
          onPointerMove={(e) => {
            if (!dragging.current || submitted) return;
            const b = e.currentTarget.getBoundingClientRect();
            setX(
              Math.max(
                0,
                Math.min(100, ((((e.clientX - b.left) / b.width) * 400 - 40) / 320) * 100)
              )
            );
            setY(
              Math.max(
                0,
                Math.min(100, ((((e.clientY - b.top) / b.height) * 240 - 40) / 160) * 100)
              )
            );
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        >
          {task.kind === "line" ? (
            <>
              <path
                d="M40 120H360 M40 110V130 M360 110V130"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path d={`M${40 + x * 3.2} 100V140`} stroke="var(--primary)" strokeWidth="5" />
              {submitted && (
                <path d="M200 90V150" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
              )}
            </>
          ) : task.kind === "center" ? (
            <>
              <rect
                x="40"
                y="40"
                width="320"
                height="160"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <circle cx={40 + x * 3.2} cy={40 + y * 1.6} r="7" fill="var(--primary)" />
              {submitted && (
                <path d="M190 120H210 M200 110V130" stroke="currentColor" strokeWidth="3" />
              )}
            </>
          ) : (
            <>
              <path
                d={`M200 190H360 M200 190L${200 + 150 * Math.cos(angle)} ${190 - 150 * Math.sin(angle)}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                d={`M245 190 A45 45 0 0 0 ${200 + 45 * Math.cos(angle)} ${190 - 45 * Math.sin(angle)}`}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
              />
            </>
          )}
        </svg>
        <label className="block">
          {task.kind === "angle" ? "Angle estimate" : "Horizontal position"}
          <input
            type="range"
            className="block w-full mt-3"
            min="0"
            max={task.kind === "angle" ? 180 : 100}
            step="0.5"
            value={x}
            aria-valuetext={
              task.kind === "angle"
                ? `${x} degrees`
                : submitted
                  ? `${x}`
                  : "Estimate position; numeric value revealed after submitting"
            }
            disabled={submitted}
            onChange={(e) => setX(Number(e.target.value))}
          />
        </label>
        {task.kind === "center" && (
          <label className="block">
            Vertical position
            <input
              type="range"
              className="block w-full mt-3"
              min="0"
              max="100"
              step="0.5"
              value={y}
              aria-valuetext={
                submitted ? `${y}` : "Estimate position; numeric value revealed after submitting"
              }
              disabled={submitted}
              onChange={(e) => setY(Number(e.target.value))}
            />
          </label>
        )}
        {task.kind === "angle" && <p>Your estimate: {x}°</p>}
        {!submitted && <Button onClick={submit}>Submit estimate</Button>}
        <div role="status">
          {submitted && (
            <>
              <p className="font-bold">Round score: {result.score.toFixed(1)} / 100</p>
              <p>
                {task.kind === "angle"
                  ? `Your estimate: ${x}°. Correct angle: ${task.target}°.`
                  : `Your position: ${x.toFixed(1)}%${task.kind === "center" ? ` / ${y.toFixed(1)}%` : ""}. Correct position: 50%${task.kind === "center" ? " / 50%" : ""}.`}{" "}
                Normalized error: {result.errorPercent.toFixed(1)}%.
              </p>
              {done && (
                <p className="text-xl font-bold mt-4">
                  Final score: {average(scores).toFixed(1)} / 100
                </p>
              )}
            </>
          )}
        </div>
        {submitted && !done && (
          <Button
            onClick={() => {
              setRound((r) => r + 1);
              setX(20);
              setY(25);
              setSubmitted(false);
            }}
          >
            Next challenge
          </Button>
        )}
        <Button variant="secondary" onClick={reset}>
          Restart
        </Button>
      </Card>
      <Card className="p-6 space-y-3">
        <h2 className="font-bold">Your personal best</h2>
        <p>
          {personal.best === null
            ? "No completed session yet."
            : `${personal.best.toFixed(1)} / 100`}
        </p>
        <Button variant="secondary" onClick={personal.clear}>
          Reset personal best
        </Button>
        <RecordExtras record={personal} />
        {personal.unavailable && (
          <p role="status">
            Browser storage is unavailable. You can still play; records may not be saved.
          </p>
        )}
      </Card>
      <p className="text-sm text-[var(--muted-foreground)]">
        Scoring: 100 × (1 − 2 × normalized error), minimum 0. Errors use line length, rectangle
        diagonal or 180° as reference. Final score is the mean of six rounds. Relative coordinates
        keep scoring independent of screen size. Records stay in this browser.
      </p>
    </div>
  );
}
