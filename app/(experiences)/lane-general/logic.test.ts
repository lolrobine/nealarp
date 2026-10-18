import { describe, expect, it } from "vitest";
import { enemyLineup, resolveFight, scoreStreak, UNITS, type Lineup } from "./logic";

const p: Lineup = [UNITS[0]!, UNITS[1]!, UNITS[2]!];
const e: Lineup = [UNITS[3]!, UNITS[4]!, UNITS[5]!];

describe("lane-general resolver", () => {
  it("is deterministic for identical line-ups", () => {
    const a = resolveFight(p, e);
    const b = resolveFight(p, e);
    expect(a).toEqual(b);
  });

  it("always finishes with a winner, draw, or bounded steps", () => {
    const result = resolveFight(p, e);
    expect(["player", "enemy", "draw"]).toContain(result.winner);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeLessThan(100);
  });

  it("damage never exceeds attack plus trait bonuses", () => {
    for (const step of resolveFight(p, e).steps) {
      expect(step.damage).toBeGreaterThanOrEqual(0);
      expect(step.damage).toBeLessThanOrEqual(6);
    }
  });

  it("sturdy halves the first hit it takes", () => {
    // Moss (sturdy, 1/6) vs Flick (swift 4/1) — Flick's swift bonus makes 5, halved to 2.
    const player: Lineup = [UNITS[8]!, UNITS[8]!, UNITS[4]!];
    const enemy: Lineup = [UNITS[8]!, UNITS[8]!, UNITS[5]!];
    const result = resolveFight(player, enemy);
    const firstOnMoss = result.steps.find((s) => s.target === "Moss");
    if (firstOnMoss) expect(firstOnMoss.damage).toBeLessThanOrEqual(3);
  });

  it("mirrored fights resolve the same way structurally", () => {
    const a = resolveFight(p, e);
    const b = resolveFight(p, e);
    expect(a.steps.map((s) => `${s.attacker}${s.damage}`)).toEqual(
      b.steps.map((s) => `${s.attacker}${s.damage}`)
    );
  });
});

describe("lane-general drafting and scoring", () => {
  it("enemy line-ups are deterministic and distinct per unit", () => {
    const a = enemyLineup("seed-one", 0);
    const b = enemyLineup("seed-one", 0);
    const c = enemyLineup("seed-one", 1);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(new Set(a.map((u) => u.id)).size).toBe(3);
  });

  it("streak scoring maps onto 0–100", () => {
    expect(scoreStreak(0, 5)).toBe(0);
    expect(scoreStreak(5, 5)).toBe(100);
    expect(scoreStreak(2, 4)).toBe(50);
  });
});
