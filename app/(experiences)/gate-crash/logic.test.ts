import { describe, expect, it } from "vitest";
import { correctGateIndex, generateRound, RULES, scoreStreak } from "./logic";

describe("gate-crash rounds", () => {
  it("every generated round is determinstic, unambiguous and solvable", () => {
    for (let round = 0; round < 40; round++) {
      const a = generateRound("gate-crash:test", round);
      const b = generateRound("gate-crash:test", round);
      expect(a).toEqual(b);
      expect(a.gates).toHaveLength(3);
      const winners = a.gates.filter((g) => a.rule.matches(g));
      expect(winners, `round ${round}`).toHaveLength(1);
      expect(correctGateIndex(a)).toBeGreaterThanOrEqual(0);
    }
  });

  it("different seeds explore different lines-up", () => {
    const first = generateRound("seed-one", 0).gates.map((g) => `${g.color}${g.shape}${g.number}`);
    const second = generateRound("seed-two", 0).gates.map((g) => `${g.color}${g.shape}${g.number}`);
    // Not a strict guarantee for one draw, but 30 rounds must differ somewhere.
    let same = 0;
    for (let round = 0; round < 30; round++) {
      const f = generateRound("seed-one", round)
        .gates.map((g) => `${g.color}${g.shape}${g.number}`)
        .join("|");
      const s = generateRound("seed-two", round)
        .gates.map((g) => `${g.color}${g.shape}${g.number}`)
        .join("|");
      if (f === s) same++;
    }
    expect(same).toBeLessThan(30);
    expect(first).toHaveLength(3);
    expect(second).toHaveLength(3);
  });

  it("rules all declare text and predicate", () => {
    expect(RULES.length).toBeGreaterThanOrEqual(8);
    for (const rule of RULES) {
      expect(rule.text.length).toBeGreaterThan(5);
      expect(typeof rule.matches).toBe("function");
    }
  });

  it("streak scoring climbs to 100 and clamps", () => {
    expect(scoreStreak(0)).toBe(0);
    expect(scoreStreak(3)).toBe(30);
    expect(scoreStreak(10)).toBe(100);
    expect(scoreStreak(50)).toBe(100);
  });
});
