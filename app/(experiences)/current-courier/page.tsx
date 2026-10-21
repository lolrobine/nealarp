"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { BestPill, SegmentedControl } from "@/lib/components/games/SettingsRow";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { isValidRoute, MAPS, routeLength, scoreRoute, type NodeId } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

export default function CurrentCourierPage() {
  const record = usePersonalBest("current-courier");
  const [mapIndex, setMapIndex] = useState(0);
  const [route, setRoute] = useState<NodeId[]>([]);
  const [bestByMap, setBestByMap] = useState<Record<number, number>>({});
  const map = MAPS[mapIndex] ?? MAPS[0]!;
  const mapRows = Math.max(...map.nodes.map((n) => Number(n.slice(1))));
  const mapCols = Math.max(...map.nodes.map((n) => n.charCodeAt(0) - 64));
  const mapCells: string[] = [];
  for (let row = 1; row <= mapRows; row++) {
    for (let col = 0; col < mapCols; col++) {
      mapCells.push(`${String.fromCharCode(65 + col)}${row}`);
    }
  }

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
    setBestByMap((b) => ({ ...b, [mapIndex]: Math.max(b[mapIndex] ?? 0, gained) }));
    record.save(gained);
    setRoute([]);
  }

  // Build SVG overlay lines between connected nodes.
  const cellPct = 100 / mapCols;
  const rowPct = 100 / mapRows;
  const nodeCenter = (node: NodeId) => {
    const col = node.charCodeAt(0) - 65;
    const row = Number(node.slice(1)) - 1;
    return { x: (col + 0.5) * cellPct, y: (row + 0.5) * rowPct };
  };
  const drawnEdges = useMemo(() => {
    const seen = new Set<string>();
    return map.edges.filter((e) => {
      const k = [e.a, e.b].sort().join("-");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [map]);

  const routeSegments = useMemo(() => {
    const segs: Array<{ a: NodeId; b: NodeId }> = [];
    for (let i = 1; i < route.length; i++) {
      segs.push({ a: route[i - 1]!, b: route[i]! });
    }
    return segs;
  }, [route]);

  const boardBest = bestByMap[mapIndex] ?? 0;

  return (
    <GameFrame
      id="current-courier"
      title="Current Courier"
      intro="Draw one unbroken delivery route through every stop. Tap node to node along the streets — the shorter the route, the higher the pay (Flight Control's draw-a-route language, original maps)."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SegmentedControl
            label="Maps"
            value={String(mapIndex)}
            onChange={(v) => {
              setMapIndex(Number(v));
              setRoute([]);
            }}
            options={MAPS.map((m, i) => ({ value: String(i), label: `${i + 1}` }))}
          />
          <span className="text-sm font-medium text-[var(--muted-foreground)]">{map.name}</span>
          <BestPill best={record.best} />
        </div>

        <div
          className="board mx-auto grid gap-0 p-3"
          style={{
            width: "min(92vw, 420px)",
            aspectRatio: `${mapCols} / ${mapRows}`,
            gridTemplateColumns: `repeat(${mapCols}, 1fr)`,
            gridTemplateRows: `repeat(${mapRows}, 1fr)`,
            position: "relative",
          }}
          role="group"
          aria-label={`Delivery map: ${map.name}`}
        >
          {/* SVG streets overlay */}
          <svg
            className="pointer-events-none absolute inset-3"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ width: "calc(100% - 1.5rem)", height: "calc(100% - 1.5rem)" }}
          >
            {/* Street grid edges */}
            {drawnEdges.map((e) => {
              const a = nodeCenter(e.a);
              const b = nodeCenter(e.b);
              return (
                <line
                  key={`${e.a}-${e.b}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  className="text-[var(--border)]"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {/* Route drawn so far */}
            {routeSegments.map((seg, i) => {
              const a = nodeCenter(seg.a);
              const b = nodeCenter(seg.b);
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  className="text-indigo-500"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {mapCells.map((node) => {
            const exists = map.nodes.includes(node);
            const isStop = map.stops.includes(node);
            const index = route.indexOf(node);
            const isLast = index === route.length - 1;
            return (
              <button
                key={node}
                type="button"
                role="gridcell"
                disabled={!exists}
                onClick={() => exists && tapNode(node)}
                aria-label={`${node}${isStop ? " stop" : ""}${index >= 0 ? ` route step ${index + 1}` : ""}`}
                className={`relative z-10 flex aspect-square items-center justify-center rounded-full border text-[10px] font-mono transition-transform active:scale-95 ${
                  !exists
                    ? "border-transparent"
                    : index >= 0
                      ? "bg-indigo-500 text-white border-indigo-700 shadow-md"
                      : isStop
                        ? "bg-amber-300 border-amber-500 text-amber-950 shadow-sm"
                        : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/50"
                } ${isLast ? "ring-2 ring-indigo-300 ring-offset-1 ring-offset-[var(--card)]" : ""}`}
              >
                {exists ? (
                  <>
                    {isStop && <span className="sr-only">(package stop)</span>}
                    <span className="hidden sm:inline">{node}</span>
                    {index >= 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-indigo-700 shadow">
                        {index + 1}
                      </span>
                    )}
                  </>
                ) : (
                  ""
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="stat-pill">
            Stops&nbsp;
            <strong>
              {route.length > 0
                ? map.stops.every((s) => route.includes(s))
                  ? map.stops.length
                  : map.stops.filter((s) => route.includes(s)).length
                : 0}
            </strong>
            /{map.stops.length}
          </span>
          <span className="stat-pill">
            Length&nbsp;<strong className="tabular-nums">{length ?? 0}</strong> / par {map.par}
          </span>
          <span
            className={`stat-pill ${valid ? "!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300" : ""}`}
          >
            {valid ? "Route complete" : "Keep drawing"}
          </span>
        </div>

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
        {boardBest > 0 && (
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Best on {map.name}: {boardBest} / 100
          </p>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="A par route, end to end">
        <ExampleStep n={1}>
          Visit every amber stop in one unbroken walk — junctions may repeat; only street edges
          count as moves. Dark indigo lines show the path you have drawn so far.
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
