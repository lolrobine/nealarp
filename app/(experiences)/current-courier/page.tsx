"use client";

import { useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { isValidRoute, MAPS, routeLength, scoreRoute, type NodeId } from "./logic";

export default function CurrentCourierPage() {
  const record = usePersonalBest("current-courier");
  const [mapIndex, setMapIndex] = useState(0);
  const [route, setRoute] = useState<NodeId[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const map = MAPS[mapIndex] ?? MAPS[0]!;

  const neighbours = (node: NodeId): NodeId[] =>
    map.edges.filter((e) => e.a === node || e.b === node).map((e) => (e.a === node ? e.b : e.a));

  function tapNode(node: NodeId) {
    if (route.length === 0) {
      setRoute([node]);
      return;
    }
    const last = route[route.length - 1]!;
    if (node === last) {
      setRoute(route.slice(0, -1));
      return;
    }
    if (route.includes(node)) return; // single walk, no revisiting for clarity
    if (!neighbours(last).includes(node)) return;
    setRoute([...route, node]);
    if (route.length + 1 > 1) {
      // score grows as stops get covered — evaluated on reveal
    }
  }

  const valid = isValidRoute(map, route);
  const score = valid ? scoreRoute(map, route) : 0;
  const length = routeLength(route, map.edges);

  function finish() {
    if (!valid) return;
    const gained = scoreRoute(map, route);
    if (gained > bestScore) setBestScore(gained);
    record.save(gained);
    setRoute([]);
  }

  return (
    <GameFrame
      id="current-courier"
      title="Current Courier"
      intro="Draw one unbroken delivery route through every stop. Tap node to node along the streets — the shorter the route, the higher the pay (Flight Control's draw-a-route language, original maps)."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Maps">
          {MAPS.map((m, i) => (
            <Button
              key={m.name}
              variant={i === mapIndex ? "default" : "outline"}
              onClick={() => {
                setMapIndex(i);
                setRoute([]);
              }}
              aria-pressed={i === mapIndex}
            >
              {i + 1}. {m.name}
            </Button>
          ))}
        </div>

        <div
          className="mx-auto grid gap-2"
          style={{ width: "min(92vw, 380px)", gridTemplateColumns: "repeat(5, 1fr)" }}
          role="grid"
          aria-label="Delivery map"
        >
          {["A1", "B1", "C1", "D1", "E1", "A2", "B2", "C2", "D2", "E2"].map((node) => {
            const exists = map.nodes.includes(node);
            const isStop = map.stops.includes(node);
            const index = route.indexOf(node);
            return (
              <button
                key={node}
                type="button"
                role="gridcell"
                disabled={!exists}
                onClick={() => tapNode(node)}
                aria-label={`${node}${isStop ? " stop" : ""}${index >= 0 ? ` route step ${index + 1}` : ""}`}
                className={`flex aspect-square items-center justify-center rounded-full border text-xs font-mono ${
                  !exists
                    ? "border-transparent"
                    : index >= 0
                      ? "bg-indigo-500 text-white border-indigo-600"
                      : isStop
                        ? "bg-amber-300 border-amber-500 text-amber-950"
                        : "bg-[var(--secondary)] border-[var(--border)]"
                }`}
              >
                {exists ? node : ""}
              </button>
            );
          })}
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]" aria-live="polite">
          Stops: {map.stops.join(", ")} · Route length: {length ?? 0} / par {map.par} ·{" "}
          {valid ? "Route complete" : "Keep drawing"}
        </p>

        <div className="flex justify-center gap-2">
          <Button onClick={finish} disabled={!valid}>
            Finish route
          </Button>
          <Button variant="outline" onClick={() => setRoute([])}>
            Clear route
          </Button>
        </div>

        {valid && (
          <p className="text-center font-bold" aria-live="polite">
            This route pays {score} / 100
          </p>
        )}
        {bestScore > 0 && (
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Best on this map: {bestScore} / 100
          </p>
        )}
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
