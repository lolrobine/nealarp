import { localDayKey, seededRandom } from "@/lib/games/daily";

/** Twelve days of running a tiny stockroom. Each morning you order stock, then the
 * day's demand is revealed. Demand comes from a deterministic per-day draw, so the
 * same seed plays the same fortnight for everyone. All numbers are fictional. */

export const DAYS = 12;
export const MAX_ORDER = 20;
export const UNIT_COST = 2;
export const UNIT_PRICE = 5;
export const SALVAGE = 1;

export type DayResult = {
  day: number;
  order: number;
  demand: number;
  sold: number;
  leftover: number;
  profit: number;
};

export function demandFor(seed: string, day: number): number {
  const random = seededRandom(`${seed}:demand:${day}`);
  // Skewed demand: most days 4–12, occasional rush or quiet day.
  const base = Math.floor(random() * 13) + 2;
  const burst = random() < 0.18 ? Math.floor(random() * 6) : 0;
  return Math.min(MAX_ORDER, base + burst);
}

export function dayProfit(
  order: number,
  demand: number
): { sold: number; leftover: number; profit: number } {
  const sold = Math.min(order, demand);
  const leftover = order - sold;
  return {
    sold,
    leftover,
    profit: sold * UNIT_PRICE + leftover * SALVAGE - order * UNIT_COST,
  };
}

export function playDay(seed: string, day: number, order: number): DayResult {
  const demand = demandFor(seed, day);
  const clamped = Math.max(0, Math.min(MAX_ORDER, order));
  const { sold, leftover, profit } = dayProfit(clamped, demand);
  return { day, order: clamped, demand, sold, leftover, profit };
}

/** Score: total profit mapped onto 0–100 against a generous benchmark of 22 per day. */
export function scoreRun(totalProfit: number): number {
  return Math.max(0, Math.min(100, Math.round((totalProfit / (DAYS * 22)) * 100)));
}

export function dailySeed(date = new Date()): string {
  return `stockroom-six:${localDayKey(date)}`;
}

/** The best fixed order for a given seed's demand series — used in tests to prove
 * the scoring rewards genuine forecasting rather than blind ordering. */
export function bestFixedOrder(seed: string): { order: number; total: number } {
  let best = { order: 0, total: -Infinity };
  for (let order = 0; order <= MAX_ORDER; order++) {
    let total = 0;
    for (let day = 0; day < DAYS; day++) total += dayProfit(order, demandFor(seed, day)).profit;
    if (total > best.total) best = { order, total };
  }
  return best;
}
