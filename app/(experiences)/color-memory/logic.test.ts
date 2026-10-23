import { describe, expect, it } from "vitest";
import {
  colorDistance,
  colorScore,
  dailyColors,
  EMPTY_HISTORY,
  isColorHistory,
  MIN_SEPARATION,
  PALETTE,
  rgb,
  ROUNDS,
} from "./logic";

/** A year of days, so a seeded generator is judged on its range and not on one lucky draw. */
const YEAR = Array.from({ length: 365 }, (_, i) =>
  new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
);

describe("daily colours", () => {
  it("hands out one colour per round", () => {
    for (const day of YEAR) expect(dailyColors(day), day).toHaveLength(ROUNDS);
  });

  it("is the same every time the same day is asked", () => {
    for (const day of YEAR.slice(0, 20)) expect(dailyColors(day)).toEqual(dailyColors(day));
    // ...and not the same answer for everyone, which would make the seed pointless.
    const distinct = new Set(YEAR.map((day) => JSON.stringify(dailyColors(day))));
    expect(distinct.size).toBe(YEAR.length);
  });

  it("stays inside the mixable part of the cube", () => {
    for (const day of YEAR) {
      for (const colour of dailyColors(day)) {
        for (const channel of colour) {
          expect(channel).toBeGreaterThanOrEqual(50);
          expect(channel).toBeLessThanOrEqual(230);
        }
      }
    }
  });

  /**
   * The bug this pins down: five independent draws produced pairs a player cannot tell
   * apart. The closest over this same year was 10.3 units, scoring 97.7 against each other,
   * so two of the five rounds were the same question wearing a different number.
   */
  it("never asks the same colour twice in a day", () => {
    let closest = Infinity;
    let where = "";
    for (const day of YEAR) {
      const colours = dailyColors(day);
      for (let i = 0; i < colours.length; i += 1) {
        for (let j = i + 1; j < colours.length; j += 1) {
          const gap = colorDistance(colours[i]!, colours[j]!);
          if (gap < closest) {
            closest = gap;
            where = `${day}: ${rgb(colours[i]!)} vs ${rgb(colours[j]!)}`;
          }
        }
      }
    }
    expect(closest, `closest pair of the year - ${where}`).toBeGreaterThanOrEqual(MIN_SEPARATION);
  });
});

describe("colorScore", () => {
  it("rewards an exact match and bottoms out at the opposite corner", () => {
    for (const colour of PALETTE) expect(colorScore(colour, colour)).toBe(100);
    expect(colorScore([0, 0, 0], [255, 255, 255])).toBeCloseTo(0);
  });

  it("stays inside nought to a hundred for every pair a day can produce", () => {
    for (const day of YEAR.slice(0, 60)) {
      const colours = dailyColors(day);
      for (const target of colours) {
        for (const guess of [...colours, [0, 0, 0], [255, 255, 255]] as const) {
          const score = colorScore(target, guess as [number, number, number]);
          expect(Number.isFinite(score)).toBe(true);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("refuses channels that are not colours", () => {
    expect(() => colorScore([NaN, 0, 0], [0, 0, 0])).toThrow();
    expect(() => colorScore([-1, 0, 0], [0, 0, 0])).toThrow();
    expect(() => colorScore([256, 0, 0], [0, 0, 0])).toThrow();
    expect(() => colorScore([0, 0, 0], [0, Infinity, 0])).toThrow();
  });
});

describe("stored history", () => {
  it("accepts what the game writes", () => {
    expect(isColorHistory(EMPTY_HISTORY)).toBe(true);
    expect(isColorHistory({ scores: [0, 55.5, 100] })).toBe(true);
  });

  it("turns away anything else, because it is read back from localStorage", () => {
    expect(isColorHistory(null)).toBe(false);
    expect(isColorHistory({})).toBe(false);
    expect(isColorHistory({ scores: "100" })).toBe(false);
    expect(isColorHistory({ scores: [101] })).toBe(false);
    expect(isColorHistory({ scores: [-1] })).toBe(false);
    expect(isColorHistory({ scores: [NaN] })).toBe(false);
    expect(isColorHistory({ scores: Array(11).fill(50) })).toBe(false);
  });
});
