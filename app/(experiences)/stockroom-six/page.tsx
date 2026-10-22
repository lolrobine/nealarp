"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import {
  dailySeed,
  dayProfit,
  DAYS,
  MAX_ORDER,
  playDay,
  scoreRun,
  SALVAGE,
  UNIT_COST,
  UNIT_PRICE,
  type DayResult,
} from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const CHART_W = 320;
const CHART_H = 150;

/** What today's order pays against every demand it could meet. The kink is the
 *  whole game: past it you are buying stock you will have to salvage. */
function PayoffChart({ order, history }: { order: number; history: number[] }) {
  const points = Array.from({ length: MAX_ORDER + 1 }, (_, d) => ({
    d,
    profit: dayProfit(order, d).profit,
  }));
  const profits = points.map((p) => p.profit);
  const lo = Math.min(0, ...profits);
  const hi = Math.max(1, ...profits);
  const px = (d: number) => 30 + (d / MAX_ORDER) * (CHART_W - 44);
  const py = (p: number) => CHART_H - 26 - ((p - lo) / (hi - lo)) * (CHART_H - 50);
  const best = points.reduce((a, b) => (b.profit > a.profit ? b : a));

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="mx-auto block h-auto w-full max-w-sm"
      role="img"
      aria-label={`Ordering ${order} units pays between ${Math.min(...profits)} and ${Math.max(
        ...profits
      )} coins depending on demand, peaking when demand reaches ${best.d}.`}
    >
      <line
        x1={30}
        y1={py(0)}
        x2={CHART_W - 14}
        y2={py(0)}
        stroke="var(--border)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text x={4} y={py(0) + 4} className="fill-[var(--muted-foreground)]" fontSize={9}>
        0
      </text>
      {/* demand you have already seen, as ticks along the bottom */}
      {history.map((d, i) => (
        <line
          key={`${d}-${i}`}
          x1={px(d)}
          y1={CHART_H - 22}
          x2={px(d)}
          y2={CHART_H - 14}
          stroke="var(--muted-foreground)"
          strokeWidth={2}
          strokeOpacity={0.6}
        />
      ))}
      <polyline
        points={points.map((p) => `${px(p.d)},${py(p.profit)}`).join(" ")}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <circle cx={px(best.d)} cy={py(best.profit)} r={4} fill="var(--primary)" />
      <text
        x={px(best.d)}
        y={py(best.profit) - 8}
        textAnchor="middle"
        fontSize={9}
        className="fill-[var(--foreground)]"
      >
        +{best.profit}
      </text>
      <text x={30} y={CHART_H - 4} fontSize={9} className="fill-[var(--muted-foreground)]">
        demand 0
      </text>
      <text
        x={CHART_W - 14}
        y={CHART_H - 4}
        textAnchor="end"
        fontSize={9}
        className="fill-[var(--muted-foreground)]"
      >
        {MAX_ORDER}
      </text>
    </svg>
  );
}

export default function StockroomSixPage() {
  const record = usePersonalBest("stockroom-six");
  const [seed, setSeed] = useState(() => dailySeed());
  const [day, setDay] = useState(0);
  const [order, setOrder] = useState(8);
  const [log, setLog] = useState<DayResult[]>([]);

  const total = useMemo(() => log.reduce((sum, r) => sum + r.profit, 0), [log]);
  const finished = log.length >= DAYS;
  const last = log[log.length - 1];

  function openDay() {
    if (finished) return;
    const result = playDay(seed, day, order);
    setLog([...log, result]);
    setDay(day + 1);
    if (log.length + 1 >= DAYS) record.save(scoreRun(total + result.profit));
  }

  function reset(useNewSeed: boolean) {
    if (useNewSeed) setSeed(`stockroom-six:${Date.now()}`);
    setDay(0);
    setLog([]);
    setOrder(8);
  }

  return (
    <GameFrame
      id="stockroom-six"
      title="Stockroom Six"
      intro="Order stock each morning for twelve days. You pay cost price for every unit, earn more for every sale, and salvage leftovers cheaply. How close can you cut supply to demand? All demand figures are fictional."
    >
      <Card className="p-6 space-y-4">
        <p className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3 text-sm">
          Fictional numbers: every customer figure in this game is generated for play. They do not
          represent real market data.
        </p>

        <div className="text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Day {Math.min(day + 1, DAYS)} of {DAYS}
          </p>
          <p className="text-lg font-bold" aria-live="polite">
            Running profit: {total} coins
          </p>
        </div>

        {!finished && (
          <>
            <label className="block">
              <span className="text-sm">
                Order for tomorrow: <strong>{order}</strong> units (you pay 2 coins each, sell at 5,
                salvage at 1)
              </span>
              <input
                type="range"
                min={0}
                max={MAX_ORDER}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="mt-2 w-full"
                aria-label={`Order quantity ${order}`}
              />
            </label>
            <PayoffChart order={order} history={log.map((r) => r.demand)} />
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              The line is what {order} units pay you at each possible demand. Ticks along the bottom
              are the demands you have already seen.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[0, 4, 8, 12, 16, 20].map((n) => (
                <Button
                  key={n}
                  variant={order === n ? "default" : "outline"}
                  onClick={() => setOrder(n)}
                  aria-pressed={order === n}
                >
                  {n}
                </Button>
              ))}
              <Button onClick={openDay}>Open the day</Button>
            </div>
          </>
        )}

        {last && (
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4"
            aria-live="polite"
          >
            <p className="font-semibold">
              Day {last.day + 1}: you ordered {last.order}, {last.demand} customers came.
            </p>
            <ul className="mt-1 grid gap-0.5 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
              <li>
                Stock bought: {last.order} × {UNIT_COST} ={" "}
                <strong className="text-[var(--foreground)]">−{last.order * UNIT_COST}</strong>
              </li>
              <li>
                Sold: {last.sold} × {UNIT_PRICE} ={" "}
                <strong className="text-[var(--foreground)]">+{last.sold * UNIT_PRICE}</strong>
              </li>
              <li>
                Salvaged: {last.leftover} × {SALVAGE} ={" "}
                <strong className="text-[var(--foreground)]">+{last.leftover * SALVAGE}</strong>
              </li>
              <li>
                {last.demand > last.order
                  ? `Turned away: ${last.demand - last.order} customers`
                  : "Turned away: nobody"}
              </li>
            </ul>
            <p className="mt-1 text-lg font-bold">
              Day profit {last.profit >= 0 ? "+" : ""}
              {last.profit} coins
            </p>
          </div>
        )}

        {log.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[var(--muted-foreground)]">
                <th className="p-1">Day</th>
                <th className="p-1">Ordered</th>
                <th className="p-1">Demand</th>
                <th className="p-1">Sold</th>
                <th className="p-1">Left</th>
                <th className="p-1">Profit</th>
              </tr>
            </thead>
            <tbody>
              {log.map((r) => (
                <tr key={r.day} className="border-t border-[var(--border)]">
                  <td className="p-1">{r.day + 1}</td>
                  <td className="p-1">{r.order}</td>
                  <td className="p-1">{r.demand}</td>
                  <td className="p-1">{r.sold}</td>
                  <td className="p-1">{r.leftover}</td>
                  <td className="p-1">{r.profit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {finished && (
          <WinScreen headline={`Fortnight profit ${total} coins`} score={scoreRun(total)}>
            <Button onClick={() => reset(false)}>Replay same season</Button>
            <Button variant="outline" onClick={() => reset(true)}>
              New season
            </Button>
          </WinScreen>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="The ordering edge">
        <ExampleStep n={1}>
          Each unit costs 2 to buy, sells at 5, salvages at 1: selling earns +3, a leftover loses
          −1, and a missed sale costs 3 of foregone profit. Demand runs 4–12 most days.
        </ExampleStep>
        <ExampleStep n={2}>
          Worked day: demand 10, you order 8 → 8 sold = +24 profit. Order 12 against demand 8 → 8
          sold (+24) minus 4 leftovers (−4) = +20. Cutting close wins.
        </ExampleStep>
        <ExampleResult>
          Twelve days averaging 22 profit: score = profit / 264 × 100 = 100.
        </ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
