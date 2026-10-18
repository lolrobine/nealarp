import { describe, expect, it } from "vitest";
import {
  applyPlacement,
  bestTotalOverAllOrders,
  EFFECTS,
  emptyState,
  growboxScore,
  isFinished,
  ITEMS,
  PERFECT_TOTAL,
  totalLevels,
  type ItemId,
} from "./logic";

const PERFECT_ORDER: ItemId[] = [
  "soil",
  "seeds",
  "water",
  "light",
  "warmth",
  "bees",
  "shelf",
  "vent",
];

describe("growbox rules", () => {
  it("places items at level 1 and never accepts duplicates", () => {
    let state = emptyState();
    state = applyPlacement(state, "soil");
    expect(state.levels.soil).toBe(1);
    const again = applyPlacement(state, "soil");
    expect(again.placed).toHaveLength(1);
  });

  it("fires each effect at most once and keeps levels at or below the cap", () => {
    let state = emptyState();
    for (const id of PERFECT_ORDER) state = applyPlacement(state, id);
    expect(new Set(state.fired).size).toBe(state.fired.length);
    expect(state.fired).toHaveLength(EFFECTS.length);
    for (const item of ITEMS) expect(state.levels[item.id]).toBeLessThanOrEqual(2);
  });

  it("known perfect order reaches the perfect total", () => {
    let state = emptyState();
    for (const id of PERFECT_ORDER) state = applyPlacement(state, id);
    expect(totalLevels(state)).toBe(PERFECT_TOTAL);
    expect(growboxScore(state)).toBe(100);
    expect(isFinished(state)).toBe(true);
  });

  it("brute-forces the maximum over all orders as the perfect total", () => {
    const best = bestTotalOverAllOrders();
    expect(best.total).toBe(PERFECT_TOTAL);
  });

  it("a careless order scores meaningfully lower", () => {
    let state = emptyState();
    for (const id of [
      "vent",
      "shelf",
      "bees",
      "warmth",
      "light",
      "water",
      "seeds",
      "soil",
    ] as ItemId[])
      state = applyPlacement(state, id);
    expect(totalLevels(state)).toBeLessThan(PERFECT_TOTAL);
    expect(growboxScore(state)).toBeLessThan(100);
  });

  it("score stays within 0-100 and logs explain gains", () => {
    let state = emptyState();
    state = applyPlacement(state, "soil");
    state = applyPlacement(state, "water");
    expect(growboxScore(state)).toBeGreaterThanOrEqual(0);
    expect(growboxScore(state)).toBeLessThanOrEqual(100);
    expect(state.log.join(" ")).toContain("Water makes the soil rich.");
  });
});
