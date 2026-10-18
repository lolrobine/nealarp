"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { CONCEPTS, discoveryScore, INGREDIENTS, mix, type Ingredient } from "./logic";

export default function PocketAlchemistPage() {
  const record = usePersonalBest("pocket-alchemist");
  const [first, setFirst] = useState<Ingredient | null>(null);
  const [second, setSecond] = useState<Ingredient | null>(null);
  const [discovered, setDiscovered] = useState<string[]>([]);

  const result = useMemo(() => (first && second ? mix(first, second) : null), [first, second]);
  const isNew = result ? !discovered.includes(result.id) : false;

  function pickIngredient(ingredient: Ingredient) {
    if (!first) setFirst(ingredient);
    else if (!second && ingredient.id !== first.id) setSecond(ingredient);
  }

  function keepResult() {
    if (result && isNew) setDiscovered([...discovered, result.id]);
    setFirst(null);
    setSecond(null);
  }

  return (
    <GameFrame
      id="pocket-alchemist"
      title="Pocket Alchemist"
      intro="Mix any two of twelve ingredients. Each hides a trait vector — the blend lands near a concept, and geometry does the inventing. Inspired by Little Alchemy 2; no recipe is copied."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap justify-center gap-2" role="list" aria-label="Ingredients">
          {INGREDIENTS.map((ingredient) => (
            <Button
              key={ingredient.id}
              variant={
                first?.id === ingredient.id || second?.id === ingredient.id ? "default" : "outline"
              }
              onClick={() => pickIngredient(ingredient)}
              aria-pressed={first?.id === ingredient.id || second?.id === ingredient.id}
            >
              {ingredient.name}
            </Button>
          ))}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]" aria-live="polite">
          {first ? `Mixing ${first.name}` : "Pick your first ingredient"}
          {second ? ` with ${second.name}` : ""}
        </p>

        {result && (
          <div
            className={`rounded-xl border p-4 text-center ${
              isNew
                ? "border-amber-500/60 bg-amber-500/10"
                : "border-[var(--border)] bg-[var(--secondary)]"
            }`}
            aria-live="polite"
          >
            <p className="text-2xl font-bold">
              {isNew ? "New discovery: " : "Known concept: "}
              {result.name}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">{result.blurb}</p>
            <Button className="mt-2" onClick={keepResult}>
              {isNew ? "Bottle it" : "Continue"}
            </Button>
          </div>
        )}

        <div>
          <h2 className="font-bold">Shelf ({discovered.length} bottled)</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Twelve bottles make a perfect shelf. Score: {discoveryScore(discovered.length)} / 100
          </p>
          {discovered.length > 0 && (
            <p className="mt-2 text-sm">
              {discovered.map((id) => CONCEPTS.find((c) => c.id === id)?.name ?? id).join(" · ")}
            </p>
          )}
        </div>

        <Button
          onClick={() => record.save(discoveryScore(discovered.length))}
          disabled={discovered.length === 0}
        >
          Save shelf score
        </Button>
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
