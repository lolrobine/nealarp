import { describe, it, expect } from "vitest";
import { TASKS, visualResult } from "./logic";

describe("visual precision", () => {
  it("contains six valid challenges", () => {
    expect(TASKS).toHaveLength(6);
    for (const task of TASKS) expect(visualResult(task, task.target, 50).score).toBe(100);
  });
  it("normalizes line and angle errors", () => {
    expect(visualResult({ kind: "line", target: 50 }, 25).score).toBe(50);
    expect(visualResult({ kind: "angle", target: 35 }, 125).score).toBe(0);
  });
  it("uses the rectangle diagonal and treats opposite corners equally", () => {
    const task = { kind: "center" as const, target: 50 };
    expect(visualResult(task, 0, 0)).toEqual(visualResult(task, 100, 100));
    expect(visualResult(task, 0, 0).score).toBeCloseTo(0);
  });
  it("never awards negative points and rejects nonfinite estimates", () => {
    expect(visualResult({ kind: "angle", target: 35 }, 180).score).toBe(0);
    expect(() => visualResult(TASKS[0]!, NaN)).toThrow();
  });
});
