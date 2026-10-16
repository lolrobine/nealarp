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
