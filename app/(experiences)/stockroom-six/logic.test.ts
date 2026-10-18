import { describe, expect, it } from "vitest";
import {
  bestFixedOrder,
  dailySeed,
  DAYS,
  dayProfit,
  demandFor,
  MAX_ORDER,
  playDay,
  scoreRun,
} from "./logic";

describe("stockroom-six demand", () => {
  it("is deterministic per seed and day", () => {
    for (let day = 0; day < DAYS; day++) {
      expect(demandFor("seed-a", day)).toBe(demandFor("seed-a", day));
    }
    expect(demandFor("seed-a", 0)).not.toBe(demandFor("seed-b", 0));
  });

  it("stays inside plausible bounds", () => {
    for (let day = 0; day < 40; day++) {
      const demand = demandFor("bounds", day);
      expect(demand).toBeGreaterThanOrEqual(2);
      expect(demand).toBeLessThanOrEqual(MAX_ORDER);
    }
  });
});

describe("stockroom-six profit", () => {
  it("rewards sales and charges for leftovers", () => {
    // Order 10, demand 6: 6 sold at 5, 4 salvaged at 1, cost 2 each.
    const result = dayProfit(10, 6);
    expect(result.sold).toBe(6);
    expect(result.leftover).toBe(4);
    expect(result.profit).toBe(6 * 5 + 4 * 1 - 10 * 2);
  });

  it("lost sales cost nothing extra but earn nothing", () => {
    const result = dayProfit(3, 10);
    expect(result.sold).toBe(3);
    expect(result.profit).toBe(3 * 5 - 3 * 2);
  });

  it("playDay clamps orders and reports the day's demand", () => {
    const day = playDay("clamp-seed", 3, 99);
    expect(day.order).toBe(MAX_ORDER);
    expect(day.demand).toBe(demandFor("clamp-seed", 3));
  });
});

describe("stockroom-six scoring", () => {
  it("maps profit onto 0–100 and clamps", () => {
    expect(scoreRun(0)).toBe(0);
    expect(scoreRun(DAYS * 22)).toBe(100);
    expect(scoreRun(-100)).toBe(0);
    expect(scoreRun(10 * DAYS * 22)).toBe(100);
  });

  it("a wise fixed order beats blind overstocking on the same season", () => {
    const seed = "season-one";
    const wise = bestFixedOrder(seed);
    expect(wise.total).toBeGreaterThan(0);
    let blindTotal = 0;
    for (let day = 0; day < DAYS; day++) blindTotal += playDay(seed, day, MAX_ORDER).profit;
    // Not universal, but on this seed ordering the optimum must not be the max.
    expect(wise.order).toBeLessThan(MAX_ORDER);
    expect(wise.total).toBeGreaterThanOrEqual(blindTotal);
  });

  it("daily seeds are date-stable", () => {
    const date = new Date("2026-10-18T09:00:00");
    expect(dailySeed(date)).toBe(dailySeed(date));
    expect(dailySeed(date)).toContain("stockroom-six");
  });
});
