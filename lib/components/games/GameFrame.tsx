"use client";
import { RecordExtras } from "./RecordExtras";
import type { ReactNode } from "react";
import { GameIcon } from "@/lib/components/GameIcon";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";

export function GameFrame({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="relative space-y-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-transparent px-6 py-10 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
          Singleplayer · No account needed
        </p>
        <h1 className="flex flex-wrap items-center justify-center gap-3 text-4xl font-bold">
          <GameIcon src={`/experiences/${id}/icon.svg`} />
          <span className="bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text">
            {title}
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)]">
          {intro}
        </p>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--ring)]/50 to-transparent"
        />
      </header>
      {children}
    </div>
  );
}
export function PersonalBest({ record }: { record: ReturnType<typeof usePersonalBest> }) {
  return (
    <Card className="p-6 space-y-3">
      <h2 className="font-bold">Your personal best</h2>
      <p className="flex items-baseline gap-2">
        {record.best === null ? (
          <span className="text-[var(--muted-foreground)]">No completed attempt yet.</span>
        ) : (
          <>
            <span className="text-3xl font-bold tabular-nums">{record.best.toFixed(1)}</span>
            <span className="text-[var(--muted-foreground)]">/ 100</span>
          </>
        )}
      </p>
      <Button variant="secondary" onClick={record.clear}>
        Reset personal best
      </Button>
      {record.unavailable && (
        <p role="status">
          Browser storage is unavailable. You can still play, but records may not be saved.
        </p>
      )}
      <RecordExtras record={record} />
      <p className="text-sm text-[var(--muted-foreground)]">
        Only stored in this browser. No leaderboard or uploads.
      </p>
    </Card>
  );
}
