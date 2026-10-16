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
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
      <header className="text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
          Singleplayer · No account needed
        </p>
        <h1 className="flex flex-wrap justify-center items-center gap-3 text-4xl font-bold">
          <GameIcon src={`/experiences/${id}/icon.svg`} />
          {title}
        </h1>
        <p className="text-lg text-[var(--muted-foreground)]">{intro}</p>
      </header>
      {children}
    </div>
  );
}
export function PersonalBest({ record }: { record: ReturnType<typeof usePersonalBest> }) {
  return (
    <Card className="p-6 space-y-3">
      <h2 className="font-bold">Your personal best</h2>
      <p>
        {record.best === null ? "No completed attempt yet." : `${record.best.toFixed(1)} / 100`}
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
