import { describe, expect, it } from "vitest";
import { allCells, comparePatterns, generatePattern, scoreBlockTalk } from "./logic";

describe("block-talk patterns", () => {
  it("generates deterministic patterns on the A1–D4 grid", () => {
    expect(allCells()).toHaveLength(16);
    const a = generatePattern("seed-one", 0);
    const b = generatePattern("seed-one", 0);
    const c = generatePattern("seed-one", 1);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    for (const cell of a) expect(allCells()).toContain(cell);
  });

  it("patterns hold three to six unique blocks", () => {
    for (let round = 0; round < 12; round++) {
      const pattern = generatePattern("sizes", round);
      expect(pattern.length).toBeGreaterThanOrEqual(3);
      expect(pattern.length).toBeLessThanOrEqual(6);
      expect(new Set(pattern).size).toBe(pattern.length);
    }
  });
});

describe("block-talk overlap", () => {
  it("perfect rebuild scores 100", () => {
    const target = ["A1", "B2", "C3"];
    const result = comparePatterns(target, target);
    expect(result.overlapPct).toBe(100);
    expect(result.missed).toEqual([]);
    expect(result.extra).toEqual([]);
    expect(scoreBlockTalk(result.overlapPct)).toBe(100);
  });

  it("partial overlap uses intersection over union", () => {
    // 2 shared, 1 missed, 1 extra → union 4 → 50%.
    const result = comparePatterns(["A1", "B2", "C3"], ["A1", "B2", "D4"]);
    expect(result.shared).toBe(2);
    expect(result.union).toBe(4);
    expect(result.overlapPct).toBe(50);
    expect(result.missed).toEqual(["C3"]);
    expect(result.extra).toEqual(["D4"]);
  });

  it("empty cases behave sensibly", () => {
    expect(comparePatterns([], []).overlapPct).toBe(100);
    expect(comparePatterns(["A1"], []).overlapPct).toBe(0);
    expect(comparePatterns([], ["A1"]).overlapPct).toBe(0);
    expect(scoreBlockTalk(-5)).toBe(0);
    expect(scoreBlockTalk(250)).toBe(100);
  });
});
