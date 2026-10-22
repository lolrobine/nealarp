"use client";

import { useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { isValidRoute, MAPS, routeLength, scoreRoute, type NodeId } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

export default function CurrentCourierPage() {
  const record = usePersonalBest("current-courier");
  const [mapIndex, setMapIndex] = useState(0);
  const [route, setRoute] = useState<NodeId[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const map = MAPS[mapIndex] ?? MAPS[0]!;
  const mapRows = Math.max(...map.nodes.map((n) => Number(n.slice(1))));
  const mapCols = Math.max(...map.nodes.map((n) => n.charCodeAt(0) - 64));
  const mapCells: string[] = [];
  for (let row = 1; row <= mapRows; row++) {
    for (let col = 0; col < mapCols; col++) {
      mapCells.push(`${String.fromCharCode(65 + col)}${row}`);
    }
  }

  /** Centre of a node inside the (gapless) grid, in SVG percent units. */
  const nodeCentre = (node: NodeId) => {
    const col = node.charCodeAt(0) - 65;
    const row = Number(node.slice(1)) - 1;
    return { x: ((col + 0.5) / mapCols) * 100, y: ((row + 0.5) / mapRows) * 100 };
  };

  const neighbours = (node: NodeId): NodeId[] =>
    map.edges.filter((e) => e.a === node || e.b === node).map((e) => (e.a === node ? e.b : e.a));

  const gridRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  /** Which junction sits under the pointer, or null between the streets. */
  function nodeAt(clientX: number, clientY: number): NodeId | null {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const col = Math.floor(((clientX - rect.left) / rect.width) * mapCols);
    const row = Math.floor(((clientY - rect.top) / rect.height) * mapRows);
    if (col < 0 || row < 0 || col >= mapCols || row >= mapRows) return null;
    const node = `${String.fromCharCode(65 + col)}${row + 1}`;
    return map.nodes.includes(node) ? node : null;
  }

  /** Dragging draws: forward onto a neighbour, backward to rub a leg out. */
  function extendTo(node: NodeId) {
    setRoute((prev) => {
      if (prev.length === 0) return [node];
      const last = prev[prev.length - 1]!;
      if (node === last) return prev;
      if (prev.length > 1 && node === prev[prev.length - 2]) return prev.slice(0, -1);
      if (!neighbours(last).includes(node)) return prev;
      return [...prev, node];
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const node = nodeAt(event.clientX, event.clientY);
    if (!node) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    tapNode(node);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const node = nodeAt(event.clientX, event.clientY);
    if (node) extendTo(node);
  }

  function endDrag() {
    draggingRef.current = false;
  }

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
    // A route is a walk: revisiting a junction is allowed (shortcuts loop back).
    if (!neighbours(last).includes(node)) return;
    setRoute([...route, node]);
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

        <div className="board mx-auto p-3" style={{ width: "min(92vw, 420px)" }}>
          <div className="relative">
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Casing first: a dark kerb under every street gives the map depth. */}
              {map.edges.map((edge) => {
                const a = nodeCentre(edge.a);
                const b = nodeCentre(edge.b);
                return (
                  <path
                    key={`kerb-${edge.a}-${edge.b}`}
                    d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                    stroke="var(--foreground)"
                    strokeOpacity={0.22}
                    strokeWidth={13}
                    strokeLinecap="round"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {/* Every street, so an empty map reads as a city rather than loose dots. */}
              {map.edges.map((edge) => {
                const a = nodeCentre(edge.a);
                const b = nodeCentre(edge.b);
                return (
                  <line
                    key={`${edge.a}-${edge.b}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="var(--border)"
                    strokeWidth={6}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {/* The route the courier has drawn so far, with a glow under it. */}
              {route.length > 1 && (
                <polyline
                  points={route
                    .map((n) => {
                      const c = nodeCentre(n);
                      return `${c.x},${c.y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="var(--primary)"
                  strokeOpacity={0.28}
                  strokeWidth={16}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {route.length > 1 && (
                <polyline
                  points={route
                    .map((n) => {
                      const c = nodeCentre(n);
                      return `${c.x},${c.y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
            <div
              ref={gridRef}
              className="relative grid touch-none"
              style={{ gridTemplateColumns: `repeat(${mapCols}, 1fr)` }}
              role="group"
              aria-label="Delivery map"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {mapCells.map((node) => {
                const exists = map.nodes.includes(node);
                const isStop = map.stops.includes(node);
                const index = route.indexOf(node);
                return (
                  <button
                    key={node}
                    type="button"
                    role="gridcell"
                    disabled={!exists}
                    // Pointers are handled by the container so a drag draws one
                    // continuous route; detail === 0 means Enter or Space.
                    onClick={(event) => {
                      if (event.detail === 0) tapNode(node);
                    }}
                    aria-label={`${node}${isStop ? " stop" : ""}${index >= 0 ? ` route step ${index + 1}` : ""}`}
                    className={`m-0.5 flex aspect-square items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold transition-colors ${
                      isStop && exists ? "ring-2 ring-amber-400 ring-offset-0" : ""
                    } ${
                      !exists
                        ? "border-transparent"
                        : index >= 0
                          ? "border-indigo-300 bg-indigo-500 text-white shadow-lg"
                          : isStop
                            ? "border-amber-500 bg-amber-300 text-amber-950"
                            : "border-[var(--border)] bg-[var(--secondary)]"
                    }`}
                  >
                    {!exists ? "" : index >= 0 ? index + 1 : node}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Drag across the junctions to draw a route, or Tab to one and press Enter. Drag back over
          the last junction to rub that leg out.
        </p>

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

      <HowToBeat summary="A par route, end to end">
        <ExampleStep n={1}>
          Visit every amber stop in one unbroken walk — junctions may repeat; only street edges
          count as moves.
        </ExampleStep>
        <ExampleStep n={2}>
          Worked example — Corner round: A1 → B1 → C1 → C2 → C3 → B3 → A3 is exactly par 6 and pays
          100. On bigger maps (Harbour grid, Ring road) plan a loop that returns past the remaining
          stops instead of backtracking.
        </ExampleStep>
        <ExampleResult>Par pays 100; every extra street costs 8 points.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
