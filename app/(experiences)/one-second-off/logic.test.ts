import { describe, it, expect } from "vitest";
import { timingResult, average } from "./logic";

describe("timing scores", () => {
  it("gives full credit for an exact target", () => {
    expect(timingResult(3000, 3)).toEqual({ errorMs: 0, score: 100 });
  });
  it("treats early and late estimates symmetrically", () => {
    expect(timingResult(2500, 3)).toEqual(timingResult(3500, 3));
  });
  it("clamps low scores and rejects invalid input", () => {
    expect(timingResult(10000, 3).score).toBe(0);
    for (const time of [-1, NaN, Infinity]) expect(() => timingResult(time, 3)).toThrow();
    expect(() => timingResult(1000, 0)).toThrow();
  });
  it("averages complete round results", () => {
    expect(average([100, 50, 0])).toBe(50);
    expect(average([])).toBe(0);
  });
});

/**
 * The numbers printed in How to beat it. Written down here so the panel cannot
 * drift away from the scoring it describes.
 */
describe("the worked example", () => {
  it("scores 95 for being 5 per cent off, whatever the target", () => {
    expect(timingResult(3150, 3).score).toBeCloseTo(95, 10);
    expect(timingResult(7350, 7).score).toBeCloseTo(95, 10);
    expect(timingResult(10500, 10).score).toBeCloseTo(95, 10);
    expect(average([95, 95, 95])).toBe(95);
  });

  it("charges the same half second very differently by target", () => {
    expect(100 - timingResult(10500, 10).score).toBeCloseTo(5, 10);
    expect(100 - timingResult(3500, 3).score).toBeCloseTo(16.67, 2);
  });

  it("still pays something for a whole second out on the short round", () => {
    expect(timingResult(4000, 3).score).toBeCloseTo(66.67, 2);
  });
});
