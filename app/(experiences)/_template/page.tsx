"use client";

import { useState } from "react";
import { GameIcon } from "@/lib/components/GameIcon";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export default function TemplateExperiencePage() {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl md:text-6xl font-bold mb-4">
            <GameIcon
              src="/experiences/spend-money/icon.webp"
              alt="Template icon — replace me"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            My New Experience
          </h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            Replace this with your tagline — make it fun!
          </p>
        </div>

        {/* Example interactive content */}
        <Card className="p-8 text-center">
          <p className="mb-4">This is a template. Build something quirky!</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              onClick={() => setCount((c) => c - 1)}
              aria-label="Decrement"
            >
              −
            </Button>
            <span className="text-2xl font-mono min-w-[3ch]" aria-live="polite">
              {count}
            </span>
            <Button onClick={() => setCount((c) => c + 1)} aria-label="Increment">
              +
            </Button>
          </div>
          {!prefersReducedMotion && (
            <p className="text-xs text-[var(--muted-foreground)] mt-4">
              Animations enabled (respects prefers-reduced-motion)
            </p>
          )}
        </Card>

        {/* TODO checklist */}
        <div className="mt-8 bg-[var(--secondary)] rounded-xl p-6 text-sm">
          <h2 className="font-bold mb-3">Checklist to launch:</h2>
          <ul className="space-y-1 list-disc list-inside text-[var(--muted-foreground)]">
            <li>Rename folder from _template to your id (e.g., my-game)</li>
            <li>Update layout.tsx metadata title/description</li>
            <li>Replace icon.webp and thumbnail.webp in public/experiences/your-id/</li>
            <li>Build your interactive UI in page.tsx</li>
            <li>Add data.ts if needed for static data</li>
            <li>Register in content/experiences.json</li>
            <li>Run pnpm typecheck, lint, test, build</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
