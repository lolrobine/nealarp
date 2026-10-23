"use client";
import { useState } from "react";
import { usePlayback } from "@/lib/hooks/usePlayback";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { ConfirmButton } from "@/lib/components/games/ConfirmButton";
import { GameFrame } from "@/lib/components/games/GameFrame";
import { useSavedProgress } from "@/lib/hooks/useSavedProgress";
import { DIG_SITES, INITIAL_DIG, isDigProgress } from "./data";
export default function Dig() {
  const playback = usePlayback();
  const [from, setFrom] = useState(0);
  const progress = useSavedProgress("how-deep-can-you-dig", INITIAL_DIG, isDigProgress);
  const { unlocked, selected } = progress.value;
  const site = DIG_SITES[selected]!;
  const done = unlocked === DIG_SITES.length - 1;
  return (
    <GameFrame
      id="how-deep-can-you-dig"
      title="How Deep Can You Dig?"
      intro="An impossible drill. A journey through a simplified Earth."
    >
      <Card className="p-6 space-y-5">
        <p>
          Unlock the next depth with each dig, then revisit any discovery. Depths use a rounded,
          illustrative Earth model—not drilling targets. Your discoveries are saved locally.
        </p>
        <progress
          className="w-full"
          value={unlocked}
          max={DIG_SITES.length - 1}
          aria-label="Journey progress"
        />
        <p>
          {unlocked + 1} / {DIG_SITES.length} discoveries
        </p>
        <label className="block" htmlFor="dig-jump">
          Jump to a discovered depth
        </label>
        <select
          id="dig-jump"
          className="block w-full mt-2 rounded border p-2 bg-[var(--background)]"
          value={selected}
          onChange={(e) => {
            setFrom(selected);
            progress.save({ unlocked, selected: Number(e.target.value) });
            playback.play(700);
          }}
        >
          {DIG_SITES.slice(0, unlocked + 1).map((s, i) => (
            <option key={s.depth} value={i}>
              {s.depth.toLocaleString("en-US")} km · {s.name}
            </option>
          ))}
        </select>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-3">
            <svg
              viewBox="0 0 280 350"
              className="w-full"
              role="img"
              aria-label="Interactive fictional drill shaft through compressed Earth layers"
            >
              {[
                "#166534",
                "#854d0e",
                "#a16207",
                "#b45309",
                "#c2410c",
                "#ea580c",
                "#f97316",
                "#fbbf24",
              ].map((c, i) => (
                <path
                  key={i}
                  d={`M0 ${25 + i * 40}Q70 ${10 + i * 40} 140 ${25 + i * 40}T280 ${25 + i * 40}V${75 + i * 40}H0Z`}
                  fill={c}
                />
              ))}
              <path d="M80 30V330" stroke="#1c1917" strokeWidth="32" />
              <path
                d={`M80 30V${45 + (from + (selected - from) * playback.progress) * 40}`}
                stroke="#fef3c7"
                strokeWidth="4"
                strokeDasharray="5 7"
              />
              <g
                transform={`translate(80 ${45 + (from + (selected - from) * playback.progress) * 40})`}
              >
                <path d="M-14-20H14L0 5Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
                <path d="M-10-14l20 4m-15 0 10 4" stroke="#64748b" strokeWidth="3" />
              </g>
              {DIG_SITES.map((s, i) => (
                <g key={s.depth}>
                  <circle
                    cx="155"
                    cy={45 + i * 40}
                    r="5"
                    fill={i <= unlocked ? "#fef3c7" : "#78350f"}
                  />
                  <text x="170" y={49 + i * 40} fill="#fff7ed" fontSize="12">
                    {s.depth.toLocaleString("en-US")} km
                  </text>
                </g>
              ))}
            </svg>
            <p className="absolute bottom-2 left-3 text-[9px] uppercase tracking-widest text-white/70">
              Illustration · depths compressed
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest">
              Your discoveries · choose one to explore
            </p>
            {DIG_SITES.slice(0, unlocked + 1).map((s, i) => (
              <button
                key={s.depth}
                aria-pressed={selected === i}
                onClick={() => {
                  setFrom(selected);
                  progress.save({ unlocked, selected: i });
                  playback.play(700);
                }}
                className={`block w-full rounded-lg border p-2 text-left text-sm transition-colors ${selected === i ? "border-[var(--primary)] bg-[var(--primary)]/10" : "bg-[var(--secondary)]"}`}
              >
                {i + 1}. {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-5">
          <div
            className="w-5 shrink-0 rounded-full bg-gradient-to-b from-emerald-700 via-amber-700 to-yellow-300 relative"
            aria-hidden="true"
          >
            <span
              className="absolute -left-1 w-7 h-2 rounded bg-[var(--foreground)]"
              style={{ top: `${(Math.log10(site.depth + 1) / Math.log10(6372)) * 95}%` }}
            />
          </div>
          <article className="rounded-xl bg-[var(--secondary)] p-6 flex-1 space-y-4">
            <p className="text-4xl font-bold tabular-nums">
              {site.depth.toLocaleString("en-US")} km
            </p>
            <h2 className="text-2xl font-bold">{site.name}</h2>
            <p>{site.text}</p>
          </article>
        </div>
        <p className="text-sm">
          The drill illustration uses equally spaced discovery stops; the small depth strip uses a
          logarithmic scale. Neither is distance to scale.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={done}
            onClick={() => {
              setFrom(selected);
              progress.save({ unlocked: unlocked + 1, selected: unlocked + 1 });
              playback.play(900);
            }}
          >
            Dig to next discovery
          </Button>
          <ConfirmButton
            question="Forget every depth you have discovered so far?"
            confirmLabel="Yes, start over"
            cancelLabel="Keep my discoveries"
            onConfirm={() => {
              progress.clear();
              setFrom(0);
              playback.reset();
            }}
          >
            Reset journey and saved discoveries
          </ConfirmButton>
        </div>
        <p role="status">
          {done
            ? "Journey complete! Every discovery is available to revisit."
            : `Next stop: ${DIG_SITES[unlocked + 1]!.depth.toLocaleString("en-US")} km.`}
          {progress.unavailable && " Storage unavailable: discoveries may not survive a reload."}
        </p>
        <details>
          <summary className="cursor-pointer">Sources and model choices</summary>
          <p>
            The layer descriptions and rounded boundary depths follow the USGS overview{" "}
            <a
              className="underline"
              href="https://pubs.usgs.gov/gip/dynamic/inside.html"
              target="_blank"
              rel="noreferrer"
            >
              Inside the Earth
            </a>
            . The 6,371 km mean radius is the reference used by the{" "}
            <a
              className="underline"
              href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html"
              target="_blank"
              rel="noreferrer"
            >
              NASA Earth Fact Sheet
            </a>
            . Stops at 1, 1,000 and 4,000 km are narrative sampling points. The drill and samples
            are fictional. Temperature and pressure are intentionally not estimated.
          </p>
        </details>
      </Card>
    </GameFrame>
  );
}
