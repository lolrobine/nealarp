import { describe, expect, it } from "vitest";
import {
  blend,
  CONCEPTS,
  discoveryScore,
  distance,
  INGREDIENTS,
  mix,
  PERFECT_SHELF,
} from "./logic";

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
    expect(discoveryScore(PERFECT_SHELF / 2)).toBe(50);
    expect(discoveryScore(PERFECT_SHELF)).toBe(100);
    expect(discoveryScore(99)).toBe(100);
  });
});

/** Every pair of ingredients, including a pair of the same one. */
function everyMix(): Set<string> {
  const found = new Set<string>();
  for (let i = 0; i < INGREDIENTS.length; i++) {
    for (let j = i; j < INGREDIENTS.length; j++) {
      found.add(mix(INGREDIENTS[i]!, INGREDIENTS[j]!).id);
    }
  }
  return found;
}

/**
 * There is no recipe list here: a result is whichever concept sits nearest
 * the blend of two ingredient vectors. That makes it easy to write a concept
 * into the atlas and never notice that no blend lands near it. Kite did
 * exactly that, sitting at high y with x near zero, a corner of the space
 * reachable only by an ingredient that is both airy and positive on x, of
 * which there is none. It was in the file and no player could ever bottle it.
 */
describe("the atlas holds nothing a player cannot reach", () => {
  it("every concept is produced by at least one pair", () => {
    const reachable = everyMix();
    const orphans = CONCEPTS.filter((c) => !reachable.has(c.id)).map((c) => c.name);
    expect(orphans).toEqual([]);
  });

  it("a perfect shelf asks for fewer bottles than exist to find", () => {
    expect(everyMix().size).toBeGreaterThanOrEqual(PERFECT_SHELF);
  });
});
