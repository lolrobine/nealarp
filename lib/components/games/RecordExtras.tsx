"use client";
import { useState } from "react";
import { Button } from "@/lib/components/ui/button";
import { localAchievements } from "@/lib/games/achievements";
import { getExperienceById } from "@/lib/registry/experiences";
import { downloadResultCard } from "@/lib/utils/resultCard";
import type { usePersonalBest } from "@/lib/hooks/usePersonalBest";

export function RecordExtras({ record }: { record: ReturnType<typeof usePersonalBest> }) {
  const [exporting, setExporting] = useState(false),
    [message, setMessage] = useState("");
  const [slug, ...settings] = record.id.split(":");
  const title = getExperienceById(slug ?? "")?.title ?? "Nealarp";
  const mode =
    settings
      .filter((s) => s !== "v1")
      .map((s) => s.replace(/level-(\d+)/, (_, n: string) => `Level ${Number(n) + 1}`))
      .join(" · ") || "Solo";
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold">Local achievements</h3>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {localAchievements(record.best).map((item) => (
          <li
            key={item.name}
            aria-label={`${item.name} ${item.unlocked ? "unlocked" : "locked"}`}
            className={`rounded-xl border p-3 text-center text-xs ${item.unlocked ? "border-amber-500/50 bg-amber-500/10" : "text-[var(--muted-foreground)]"}`}
          >
            <span className="block mb-1 text-lg" aria-hidden="true">
              {item.unlocked ? "★" : "☆"}
            </span>
            <strong className="block">{item.name}</strong>
            <span>
              {item.unlocked
                ? "Unlocked"
                : item.threshold === 0
                  ? "Finish a session"
                  : `${item.threshold}+ points`}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--muted-foreground)]">
        Achievements follow this mode&apos;s saved best. Resetting that best resets these badges. No
        accounts, uploads or missed-day penalties.
      </p>
      <Button
        variant="outline"
        disabled={record.best === null || exporting}
        onClick={async () => {
          if (record.best === null) return;
          setExporting(true);
          setMessage("");
          try {
            await downloadResultCard({ title, mode, score: record.best });
            setMessage("Result card downloaded. It contains only the game, mode and score.");
          } catch {
            setMessage("Image export is not supported in this browser. Your score is still saved.");
          } finally {
            setExporting(false);
          }
        }}
      >
        {exporting ? "Creating image…" : "Download result card"}
      </Button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
