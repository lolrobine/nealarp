import { describe, expect, it } from "vitest";
import {
  copyScore,
  normalize,
  resample,
  stabilityScore,
  strokeLength,
  type Drawing,
} from "./logic";

const circle: Drawing = [
  Array.from({ length: 24 }, (_, i) => ({
    x: Math.cos((i / 23) * Math.PI * 2) * 50 + 60,
    y: Math.sin((i / 23) * Math.PI * 2) * 50 + 60,
  })),
];
const square: Drawing = [
  [
    { x: 10, y: 10 },
    { x: 110, y: 10 },
    { x: 110, y: 110 },
    { x: 10, y: 110 },
    { x: 10, y: 10 },
  ],
];
const line: Drawing = [
  [
    { x: 10, y: 60 },
    { x: 110, y: 60 },
  ],
];

describe("copy-machine metric", () => {
  it("an identical copy scores 100", () => {
    expect(copyScore(circle, circle)).toBe(100);
    expect(copyScore(square, square)).toBe(100);
  });

  it("empty drawings score 0 and scores stay within bounds", () => {
    expect(copyScore(circle, [])).toBe(0);
    expect(copyScore([], circle)).toBe(0);
    const shifted = circle.map((s) => s.map((p) => ({ x: p.x + 400, y: p.y - 250 })));
    expect(copyScore(circle, shifted)).toBeGreaterThanOrEqual(0);
    expect(copyScore(circle, shifted)).toBeLessThanOrEqual(100);
  });

  it("normalization removes translation and scale", () => {
    const shifted = square.map((s) => s.map((p) => ({ x: p.x * 3 + 900, y: p.y * 3 - 40 })));
    const a = normalize(square);
    const b = normalize(shifted);
    expect(a[0]![0]!.x).toBeCloseTo(b[0]![0]!.x, 5);
    expect(a[0]![0]!.y).toBeCloseTo(b[0]![0]!.y, 5);
    expect(copyScore(square, shifted)).toBeGreaterThan(95);
  });

  it("similar outlines score mid-high while a foreign shape scores low", () => {
    // A square and a circle occupy the same outline footprint (calibrated: ~80).
    expect(copyScore(circle, square)).toBeGreaterThan(55);
    expect(copyScore(circle, square)).toBeLessThan(95);
    // A straight line is nothing like a circle (calibrated: ~39).
    expect(copyScore(circle, line)).toBeLessThan(55);
  });

  it("resample keeps endpoints and requested length", () => {
    const resampled = resample(square[0]!, 20);
    expect(resampled).toHaveLength(20);
    expect(strokeLength(square[0]!)).toBeGreaterThan(0);
  });

  it("stability averages consecutive generations", () => {
    const lineage: Drawing[] = [circle, circle, line];
    // 100 between gens 1-2, much lower between 2-3.
    const score = stabilityScore(lineage);
    expect(score).toBeGreaterThan(20);
    expect(score).toBeLessThan(80);
    expect(stabilityScore([circle])).toBe(0);
  });
});
