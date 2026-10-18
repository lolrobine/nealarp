import { describe, expect, it } from "vitest";
import { blend, CONCEPTS, discoveryScore, distance, INGREDIENTS, mix } from "./logic";

describe("pocket-alchemist vectors", () => {
  it("ships twelve ingredients and a rich concept atlas", () => {
    expect(INGREDIENTS).toHaveLength(12);
    expect(CONCEPTS.length).toBeGreaterThanOrEqual(20);
  });

  it("mixing is commutative and deterministic", () => {
    const [a, b] = [INGREDIENTS[0]!, INGREDIENTS[1]!];
    expect(mix(a, b)).toEqual(mix(b, a));
    expect(mix(a, b)).toEqual(mix(a, b));
  });

  it("blending halves the vector gap", () => {
    const blended = blend({ x: 1, y: -1 }, { x: -1, y: 1 });
    expect(blended.x).toBeCloseTo(0);
    expect(blended.y).toBeCloseTo(0);
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("results always come from the concept atlas", () => {
    for (let i = 0; i < INGREDIENTS.length; i++) {
      for (let j = i + 1; j < INGREDIENTS.length; j++) {
        const result = mix(INGREDIENTS[i]!, INGREDIENTS[j]!);
        expect(CONCEPTS).toContain(result);
      }
    }
  });

  it("pairs of the same ingredient still land somewhere", () => {
    const result = mix(INGREDIENTS[2]!, INGREDIENTS[2]!);
    expect(CONCEPTS).toContain(result);
  });

  it("discovery scoring is linear and clamped", () => {
    expect(discoveryScore(0)).toBe(0);
    expect(discoveryScore(6)).toBe(50);
    expect(discoveryScore(12)).toBe(100);
    expect(discoveryScore(99)).toBe(100);
  });
});
