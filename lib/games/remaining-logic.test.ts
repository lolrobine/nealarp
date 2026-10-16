import { describe, it, expect } from "vitest";
import { PALETTE, colorScore } from "@/app/(experiences)/color-memory/logic";
import { QUESTIONS, isCorrect } from "@/app/(experiences)/which-is-more/logic";
import { PROMPTS, validateAnswer, isFormProgress } from "@/app/(experiences)/form-game/logic";
import {
  LEVELS,
  canPlace,
  rotate,
  occupied,
  type Placement,
} from "@/app/(experiences)/pack-it-perfectly/logic";
import { GOLF_LEVELS, simulateFlight } from "@/app/(experiences)/gravity-golf/logic";
import {
  INITIAL_ECOSYSTEM,
  ecosystemStep,
  isAlive,
} from "@/app/(experiences)/tiny-ecosystem/logic";
import { bounceExperiment } from "@/app/(experiences)/one-small-change/logic";
import { DIG_SITES, isDigProgress } from "@/app/(experiences)/how-deep-can-you-dig/data";

export const FORM_SOLUTION = [
  "Ada",
  "mint",
  "20+5",
  "Please let me apply for this permit.",
  "permit",
  "4",
  "A-42",
  "this form is not a sandwich",
  "TIMREP",
  "I authorize this authorization",
];
describe("color memory", () => {
  it("gives exact matches 100 and opposite RGB corners zero", () => {
    for (const color of PALETTE) expect(colorScore(color, color)).toBe(100);
    expect(colorScore([0, 0, 0], [255, 255, 255])).toBeCloseTo(0);
    expect(() => colorScore([NaN, 0, 0], [0, 0, 0])).toThrow();
  });
});
describe("comparison questions", () => {
  it("has ten unambiguous comparisons and five per category", () => {
    expect(QUESTIONS).toHaveLength(10);
    expect(QUESTIONS.filter((q) => q.category === "speed")).toHaveLength(5);
    for (const q of QUESTIONS) {
      expect(q.a).not.toBe(q.b);
      expect(isCorrect(q, q.a > q.b ? "left" : "right")).toBe(true);
      expect(isCorrect(q, q.a > q.b ? "right" : "left")).toBe(false);
    }
  });
});
describe("form rules", () => {
  it("has a complete valid path through all ten requirements", () => {
    expect(PROMPTS).toHaveLength(FORM_SOLUTION.length);
    FORM_SOLUTION.forEach((answer, i) =>
      expect(validateAnswer(i, answer, FORM_SOLUTION.slice(0, i))).toBe(true)
    );
    expect(isFormProgress({ answers: FORM_SOLUTION })).toBe(true);
  });
  it("rejects broken dependencies and malformed saves", () => {
    expect(validateAnswer(1, "adam", ["Ada"])).toBe(false);
    expect(validateAnswer(2, "eval(20+5)", [])).toBe(false);
    expect(isFormProgress({ answers: ["Ada", "adam"] })).toBe(false);
    expect(isFormProgress({ answers: Array(11).fill("Ada") })).toBe(false);
  });
});
describe("packing levels", () => {
  it.each(LEVELS)("has a complete nonoverlapping solution for $name", (level) => {
    const placements: Placement[] = [];
    for (const p of level.solution) {
      expect(canPlace(level, placements, p)).toBe(true);
      placements.push(p);
    }
    expect(occupied(level, placements).size).toBe(level.width * level.height);
  });
  it("rejects collisions, duplicates and out-of-bounds origins", () => {
    const level = LEVELS[0]!;
    const p = level.solution[0]!;
    expect(canPlace(level, [p], p)).toBe(false);
    expect(canPlace(level, [p], { id: "B", x: 0, y: 0, rotation: 0 })).toBe(false);
    expect(canPlace(level, [], { ...p, x: -1 })).toBe(false);
    expect(canPlace(level, [], { ...p, x: 3 })).toBe(false);
    expect(
      rotate(
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        4
      )
    ).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
  });
});
describe("golf physics", () => {
  it.each(GOLF_LEVELS)("has a reachable goal for $name", (level) => {
    let winning: { angle: number; power: number } | null = null;
    for (let angle = 15; angle <= 45 && !winning; angle += 0.5) {
      for (let power = 100; power <= 220; power += 5) {
        if (simulateFlight(level, angle, power).outcome === "goal") {
          winning = { angle, power };
          break;
        }
      }
    }
    expect(winning).not.toBeNull();
    const first = simulateFlight(level, winning!.angle, winning!.power);
    expect(first).toEqual(simulateFlight(level, winning!.angle, winning!.power));
    expect(first.path.length).toBeLessThanOrEqual(362);
  });
  it("ends blocked, out-of-bounds and invalid launches", () => {
    const level = GOLF_LEVELS[0]!;
    expect(
      simulateFlight({ ...level, walls: [{ x: 70, y: 0, w: 10, h: 360 }] }, 0, 100).outcome
    ).toBe("collision");
    expect(simulateFlight({ ...level, planets: [] }, 0, 200).outcome).toBe("out");
    expect(() => simulateFlight(level, NaN, 100)).toThrow();
  });
});
describe("ecosystem", () => {
  it("supports a complete twelve-turn survival path", () => {
    let state = INITIAL_ECOSYSTEM;
    for (let i = 0; i < 12; i++) {
      state = ecosystemStep(state);
      expect(isAlive(state)).toBe(true);
    }
    expect(state.round).toBe(12);
  });
  it("detects extinction and bounds populations", () => {
    const next = ecosystemStep({ plants: 0, herbivores: 30, predators: 12, round: 0 });
    expect(next.plants).toBe(0);
    expect(isAlive(next)).toBe(false);
    expect(() => ecosystemStep({ ...INITIAL_ECOSYSTEM, plants: NaN })).toThrow();
  });
});
describe("bounce experiment", () => {
  it("keeps a reproducible baseline and retains more motion with higher restitution", () => {
    const low = bounceExperiment(0.2),
      high = bounceExperiment(0.95);
    expect(high.distance).toBeGreaterThan(low.distance);
    expect(high.samples).toHaveLength(481);
    expect(high).toEqual(bounceExperiment(0.95));
    expect(high.samples.every((s) => s.height >= 0 && s.height <= 5)).toBe(true);
    expect(() => bounceExperiment(1)).toThrow();
  });
});
describe("dig discoveries", () => {
  it("has ordered depths and validates saved navigation", () => {
    expect(DIG_SITES).toHaveLength(8);
    for (let i = 1; i < DIG_SITES.length; i++)
      expect(DIG_SITES[i]!.depth).toBeGreaterThan(DIG_SITES[i - 1]!.depth);
    expect(isDigProgress({ unlocked: 7, selected: 7 })).toBe(true);
    expect(isDigProgress({ unlocked: 8, selected: 7 })).toBe(false);
    expect(isDigProgress({ unlocked: 2, selected: 3 })).toBe(false);
  });
});
