import { describe, expect, it } from "vitest";
import { bounceExperiment } from "./logic";

describe("bounceExperiment input guarding", () => {
  it("accepts the ends of the advertised range", () => {
    expect(() => bounceExperiment(0.2)).not.toThrow();
    expect(() => bounceExperiment(0.95)).not.toThrow();
  });

  it("refuses a restitution outside the range rather than returning nonsense", () => {
    expect(() => bounceExperiment(0.19)).toThrow();
    expect(() => bounceExperiment(0.96)).toThrow();
    expect(() => bounceExperiment(-1)).toThrow();
    expect(() => bounceExperiment(NaN)).toThrow();
    expect(() => bounceExperiment(Infinity)).toThrow();
  });
});

describe("the simulated drop", () => {
  it("is deterministic, so the same slider always draws the same curve", () => {
    expect(bounceExperiment(0.6)).toEqual(bounceExperiment(0.6));
  });

  it("samples the whole eight seconds at a steady rate", () => {
    const { samples } = bounceExperiment(0.6);
    expect(samples).toHaveLength(481);
    expect(samples[0]).toEqual({ time: 0, height: 5 });
    expect(samples.at(-1)!.time).toBeCloseTo(8, 5);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!.time).toBeGreaterThan(samples[i - 1]!.time);
    }
  });

  it("never lets the ball fall through the floor or above its drop height", () => {
    for (const restitution of [0.2, 0.45, 0.7, 0.95]) {
      for (const { height } of bounceExperiment(restitution).samples) {
        expect(height).toBeGreaterThanOrEqual(0);
        expect(height).toBeLessThanOrEqual(5.001);
      }
    }
  });

  it("starts at the stated five metres", () => {
    expect(bounceExperiment(0.5).samples[0]!.height).toBe(5);
  });
});

describe("what the restitution slider actually changes", () => {
  it("makes a livelier ball travel further, every step of the way", () => {
    const distances = [0.2, 0.35, 0.5, 0.65, 0.8, 0.95].map((r) => bounceExperiment(r).distance);
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]!).toBeGreaterThan(distances[i - 1]!);
    }
  });

  it("brings a dead ball to rest well inside the window", () => {
    const dull = bounceExperiment(0.2);
    expect(dull.samples.at(-1)!.height).toBe(0);
  });

  it("leaves a lively ball still moving when the clock runs out", () => {
    expect(bounceExperiment(0.95).samples.at(-1)!.height).toBeGreaterThan(0);
  });

  /**
   * Worth pinning down because it reads like a bug and is not: the bounce
   * count peaks in the middle. A dead ball stops early so it never gets many
   * bounces, and a lively one spends so long in the air that few fit into
   * eight seconds.
   */
  it("counts the most bounces for a middling ball, not the liveliest one", () => {
    const bouncy = bounceExperiment(0.95).bounces;
    const middling = bounceExperiment(0.8).bounces;
    const dead = bounceExperiment(0.2).bounces;
    expect(middling).toBeGreaterThan(bouncy);
    expect(middling).toBeGreaterThan(dead);
  });

  it("always bounces at least once in eight seconds", () => {
    for (const r of [0.2, 0.5, 0.95]) expect(bounceExperiment(r).bounces).toBeGreaterThan(0);
  });
});
