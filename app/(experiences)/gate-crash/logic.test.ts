import { describe, expect, it } from "vitest";
import { COLORS, correctGateIndex, FAMILIES, generateRound, RULES, scoreStreak } from "./logic";

/** A wide sample of rounds, the way a year of daily seeds would look. */
function sample(seeds = 300, roundsPerSeed = 12) {
  const rounds = [];
  for (let s = 0; s < seeds; s++) {
    for (let r = 0; r < roundsPerSeed; r++) rounds.push(generateRound(`sample-${s}`, r));
  }
  return rounds;
}

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

  it("does not let the position of a gate give its colour away", () => {
    // Colours used to be handed out in array order, so the first gate was
    // amber in every round ever generated and "crash the violet gate" meant
    // "crash the last one" without looking.
    const seen = [new Set<string>(), new Set<string>(), new Set<string>()];
    for (const round of sample()) round.gates.forEach((g, i) => seen[i]!.add(g.color));
    for (const position of seen) expect([...position].sort()).toEqual([...COLORS].sort());
  });

  it("still gives every round three different colours", () => {
    for (const round of sample(60)) {
      expect(new Set(round.gates.map((g) => g.color)).size).toBe(3);
    }
  });

  it("asks about numbers and shapes about as often as about colours", () => {
    const rounds = sample();
    for (const family of FAMILIES) {
      const share = rounds.filter((r) => r.rule.family === family).length / rounds.length;
      expect(share, `${family} share`).toBeGreaterThan(0.2);
    }
  });

  it("only asks for the highest or lowest number when that gate really is it", () => {
    for (const round of sample(120)) {
      const numbers = round.gates.map((g) => g.number);
      const winner = round.gates[correctGateIndex(round)]!;
      if (round.rule.id === "highest") expect(winner.number).toBe(Math.max(...numbers));
      if (round.rule.id === "lowest") expect(winner.number).toBe(Math.min(...numbers));
    }
  });

  it("every rule belongs to a known family", () => {
    for (const rule of RULES) expect(FAMILIES).toContain(rule.family);
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
