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

describe("the task's own target", () => {
  it("grades a line against its target rather than the middle", () => {
    // Every shipped line task sits at 50, so this is the guard for the next one.
    const offCentre = { kind: "line", target: 30 } as const;
    expect(visualResult(offCentre, 30).score).toBe(100);
    expect(visualResult(offCentre, 50).score).toBeCloseTo(60, 10);
  });

  it("grades a centre against its target in both axes", () => {
    const offCentre = { kind: "center", target: 30 } as const;
    expect(visualResult(offCentre, 30, 30).score).toBe(100);
  });

  it("still scores the shipped tasks exactly as before", () => {
    expect(visualResult({ kind: "line", target: 50 }, 50).score).toBe(100);
    expect(visualResult({ kind: "center", target: 50 }, 50, 50).score).toBe(100);
  });
});

/** The scale comparison printed in How to beat it. */
describe("the worked example", () => {
  it("charges the same ten-unit miss very differently by task", () => {
    expect(visualResult({ kind: "line", target: 50 }, 60).score).toBeCloseTo(80, 10);
    expect(visualResult({ kind: "center", target: 50 }, 60, 50).score).toBeCloseTo(85.86, 2);
    expect(visualResult({ kind: "angle", target: 35 }, 45).score).toBeCloseTo(88.89, 2);
  });
});

describe("the claim that two units out clears 95", () => {
  it("holds for the worst two-unit miss on every shipped task", () => {
    const worst = TASKS.map((task) =>
      task.kind === "center"
        ? visualResult(task, task.target + 2, task.target + 2).score
        : visualResult(task, task.target + 2).score
    );
    for (const score of worst) expect(score).toBeGreaterThan(95);
    expect(worst.reduce((a, b) => a + b, 0) / worst.length).toBeGreaterThan(95);
  });
});
