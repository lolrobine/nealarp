import { describe, expect, it } from "vitest";
import { buildRun, dailySeed, PROMPTS, ROUNDS, scoreRound, scoreRun } from "./logic";

describe("pass-the-pencil runs", () => {
  it("ships plenty of original prompts", () => {
    expect(PROMPTS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(PROMPTS).size).toBe(PROMPTS.length);
  });

  it("runs are deterministic per seed with alternating memory rounds", () => {
    const a = buildRun("seed-one");
    const b = buildRun("seed-one");
    const c = buildRun("seed-two");
    expect(a).toEqual(b);
    expect(a).toHaveLength(ROUNDS);
    expect(a[1]!.memoryRound).toBe(true);
    expect(a[0]!.memoryRound).toBe(false);
    expect(a[3]!.memoryRound).toBe(true);
    // Different seeds shuffle different first prompts most of the time.
    const sameFirst = a[0]!.prompt === c[0]!.prompt;
    const allSame = a.every((r, i) => r.prompt === c[i]!.prompt);
    if (sameFirst) expect(allSame).toBe(false);
  });

  it("every round carries a prompt", () => {
    for (const round of buildRun("seed-three")) {
      expect(PROMPTS).toContain(round.prompt);
    }
  });
});

describe("pass-the-pencil scoring", () => {
  it("mixes recognition and effort, clamped 0–100", () => {
    expect(scoreRound(0, 0)).toBe(0);
    expect(scoreRound(5, 5)).toBe(100);
    expect(scoreRound(3, 2)).toBe(52);
    expect(scoreRound(99, 99)).toBe(100);
    expect(scoreRun([])).toBe(0);
    expect(
      scoreRun([
        { index: 0, match: 5, effort: 5 },
        { index: 1, match: 0, effort: 0 },
      ])
    ).toBe(50);
  });

  it("daily seeds are stable", () => {
    const date = new Date("2026-10-18T12:00:00");
    expect(dailySeed(date)).toBe(dailySeed(date));
    expect(dailySeed(date)).toContain("pass-the-pencil");
  });
});
