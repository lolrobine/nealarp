import { describe, it, expect } from "vitest";
import { localDayKey, seededRandom, seededShuffle } from "./daily";
import { dailyColors } from "@/app/(experiences)/color-memory/logic";
import { dailyQuestions, isCorrect, QUESTIONS } from "@/app/(experiences)/which-is-more/logic";
import { localAchievements } from "./achievements";

describe("personal daily tasks", () => {
  it("uses local calendar fields, including leading zeros", () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  it("is repeatable and does not mutate question data", () => {
    expect(dailyColors("2026-10-16")).toEqual(dailyColors("2026-10-16"));
    expect(dailyColors("2026-10-16")).not.toEqual(dailyColors("2026-10-17"));
    expect(
      dailyColors("2026-10-16").every((c) => c.length === 3 && c.every((n) => n >= 50 && n <= 230))
    ).toBe(true);
    const original = JSON.stringify(QUESTIONS),
      questions = dailyQuestions("2026-10-16");
    expect(questions).toHaveLength(10);
    expect(questions).toEqual(dailyQuestions("2026-10-16"));
    expect(JSON.stringify(QUESTIONS)).toBe(original);
    for (const q of questions) {
      expect(isCorrect(q, q.a > q.b ? "left" : "right")).toBe(true);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });
  it("shuffles without dropping or duplicating entries", () => {
    expect(seededShuffle([1, 2, 3, 4], "day").sort()).toEqual([1, 2, 3, 4]);
    const rng = seededRandom("seed");
    for (let i = 0; i < 100; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});
describe("local achievement thresholds", () => {
  it("starts locked and unlocks only completed score milestones", () => {
    expect(localAchievements(null).every((a) => !a.unlocked)).toBe(true);
    expect(
      localAchievements(0)
        .filter((a) => a.unlocked)
        .map((a) => a.name)
    ).toEqual(["First finish"]);
    expect(localAchievements(94).find((a) => a.name === "Gold")?.unlocked).toBe(false);
    expect(localAchievements(95).find((a) => a.name === "Gold")?.unlocked).toBe(true);
    expect(localAchievements(100).every((a) => a.unlocked)).toBe(true);
    expect(localAchievements(NaN).every((a) => !a.unlocked)).toBe(true);
  });
});
