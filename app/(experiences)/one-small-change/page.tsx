"use client";
import { useMemo, useState } from "react";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Slider } from "@/lib/components/ui/slider";
import { usePlayback } from "@/lib/hooks/usePlayback";
import { GameFrame } from "@/lib/components/games/GameFrame";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { bounceExperiment, type BounceResult } from "./logic";

const points = (r: BounceResult) =>
  r.samples.map((s) => `${40 + (s.time / 8) * 520},${250 - (s.height / 5) * 210}`).join(" ");

export default function OneSmallChange() {
  const [elasticity, setElasticity] = useState(0.8);
  const [result, setResult] = useState<{ coefficient: number; trial: BounceResult } | null>(null);
  const playback = usePlayback();
  const [scrub, setScrub] = useState(0);
  const stillMode = usePrefersReducedMotion();
  const frame = Math.min(480, Math.round(playback.progress * 480));
  // The reference run and both curves used to be recomputed on every render,
  // which during playback means once per animation frame for eight seconds.
  const baseline = useMemo(() => bounceExperiment(0.65), []);
  const baselinePoints = useMemo(() => points(baseline), [baseline]);
  const trialPoints = useMemo(() => (result ? points(result.trial) : ""), [result]);
  return (
    <GameFrame
      id="one-small-change"
      title="One Small Change"
      intro="Change one rule. Watch the consequences unfold."
    >
      <Card className="p-6 space-y-5">
        <h2 className="text-2xl font-bold">Experiment 1 · A bouncing ball</h2>
        <p>
          Drop the same ball from 5 metres for eight simulated seconds. Change only the restitution
          coefficient: the fraction of impact speed retained after a bounce. The reference is always
          0.65. Nothing else changes.
        </p>
        <Slider
          label="Restitution coefficient"
          valueText={elasticity.toFixed(2)}
          min={0.2}
          max={0.95}
          step={0.05}
          value={elasticity}
          onChange={(e) => setElasticity(Number(e.target.value))}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setResult({ coefficient: elasticity, trial: bounceExperiment(elasticity) });
              playback.play(8000);
              setScrub(0);
            }}
          >
            Run experiment
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setElasticity(0.8);
              setResult(null);
              playback.reset();
              setScrub(0);
            }}
          >
            Reset experiment
          </Button>
        </div>
        {result && (
          <div className="space-y-4 rounded-2xl bg-slate-950 p-4 text-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span>Reference · 0.65</span>
              <span>Trial · {result.coefficient.toFixed(2)}</span>
            </div>
            <svg
              viewBox="0 0 600 230"
              className="w-full"
              role="img"
              aria-label="Live comparison of two bouncing balls"
            >
              <path d="M35 200H565 M300 20V200" stroke="#334155" strokeWidth="2" />
              <ellipse cx="155" cy="203" rx="28" ry="5" fill="#475569" />
              <ellipse cx="445" cy="203" rx="28" ry="5" fill="#4c1d95" />
              <circle
                cx="155"
                cy={185 - (baseline.samples[frame]!.height / 5) * 155}
                r="15"
                fill="#e2e8f0"
              />
              <circle
                cx="445"
                cy={185 - (result.trial.samples[frame]!.height / 5) * 155}
                r="15"
                fill="#a78bfa"
              />
            </svg>
            {stillMode ? (
              <p className="text-sm text-slate-300">
                Your system asks for reduced motion, so the drop is not animated: both balls are
                shown at their final state. The timeline below steps through every instant of the
                experiment.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => (playback.running ? playback.pause() : playback.resume())}
                >
                  {playback.running ? "Pause playback" : "Play / resume"}
                </Button>
                <Button variant="secondary" onClick={() => playback.play(8000)}>
                  Replay drop
                </Button>
                <Button variant="ghost" onClick={playback.reset}>
                  Show final state
                </Button>
              </div>
            )}
            <Slider
              label="Experiment timeline"
              valueText={`${(playback.progress * 8).toFixed(2)} s`}
              min={0}
              max={8}
              step={0.05}
              value={playback.progress * 8}
              onChange={(e) => {
                setScrub(Number(e.target.value));
                playback.seek(Number(e.target.value) / 8);
              }}
            />
            <p className="text-xs text-slate-400">
              Drag the timeline to inspect any instant.{" "}
              {scrub > 0 && !playback.running ? "Timeline paused for inspection." : ""}
            </p>
          </div>
        )}
        <svg
          viewBox="0 0 600 300"
          role="img"
          aria-label="Height over eight seconds; solid reference curve and dashed experimental curve"
          className="w-full rounded-xl bg-[var(--secondary)]"
        >
          <path d="M40 30V250H570" fill="none" stroke="currentColor" />
          <text x="8" y="30" fill="currentColor" fontSize="14">
            5 m
          </text>
          <text x="8" y="250" fill="currentColor" fontSize="14">
            0
          </text>
          <text x="40" y="280" fill="currentColor" fontSize="14">
            0 s
          </text>
          <text x="540" y="280" fill="currentColor" fontSize="14">
            8 s
          </text>
          <polyline points={baselinePoints} fill="none" stroke="currentColor" strokeWidth="2" />
          {result && (
            <path
              d={`M${40 + playback.progress * 520} 30V250`}
              stroke="var(--primary)"
              strokeDasharray="3 5"
            />
          )}
          {result && (
            <polyline
              points={trialPoints}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeDasharray="7 4"
            />
          )}
        </svg>
        <p>
          Solid line: reference 0.65. Dashed line:{" "}
          {result ? `experiment ${result.coefficient.toFixed(2)}` : "run an experiment to compare"}.
        </p>
        <div role="status">
          {result && (
            <>
              <h3 className="font-bold">Experiment complete</h3>
              <p>
                Reference distance travelled: {baseline.distance.toFixed(2)} m. Your trial:{" "}
                {result.trial.distance.toFixed(2)} m. Difference:{" "}
                {(result.trial.distance - baseline.distance).toFixed(2)} m.
              </p>
              {result.coefficient !== elasticity && (
                <p>Settings changed. Run again to update the plot.</p>
              )}
            </>
          )}
        </div>
        {result && (
          <details>
            <summary className="cursor-pointer">Read the height data</summary>
            <table className="w-full text-left">
              <caption>Height in metres at whole seconds</caption>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Reference</th>
                  <th>Trial</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 9 }, (_, i) => (
                  <tr key={i}>
                    <th>{i} s</th>
                    <td>{baseline.samples[i * 60]!.height.toFixed(2)}</td>
                    <td>{result.trial.samples[i * 60]!.height.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
        <p className="text-sm text-[var(--muted-foreground)]">
          Model assumptions: constant downward acceleration 9.81 m/s², point ball, rigid floor, no
          drag, 1/240-second integration steps. Very small bounces are stopped numerically.
          Distances are approximate model outputs, not measured predictions. This is an untimed solo
          experiment with no score.
        </p>
      </Card>
    </GameFrame>
  );
}
