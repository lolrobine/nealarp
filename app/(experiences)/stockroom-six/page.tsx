"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { dailySeed, DAYS, MAX_ORDER, playDay, scoreRun, type DayResult } from "./logic";

export default function StockroomSixPage() {
  const record = usePersonalBest("stockroom-six");
  const [seed, setSeed] = useState(() => dailySeed());
  const [day, setDay] = useState(0);
  const [order, setOrder] = useState(8);
  const [log, setLog] = useState<DayResult[]>([]);

  const total = useMemo(() => log.reduce((sum, r) => sum + r.profit, 0), [log]);
  const finished = log.length >= DAYS;

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
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">
              Fortnight profit {total} coins · {scoreRun(total)} / 100
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button onClick={() => reset(false)}>Replay same season</Button>
              <Button variant="outline" onClick={() => reset(true)}>
                New season
              </Button>
            </div>
          </div>
        )}
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
