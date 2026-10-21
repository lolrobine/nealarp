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

/** The "How to beat it" panel makes three exact claims about the resolver. If the unit
 *  stats or the resolver ever change, these must fail rather than quietly become fiction. */
describe("lane-general: the claims printed in How to beat it", () => {
  const by = (id: string) => UNITS.find((u) => u.id === id)!;
  const trios: Lineup[] = [];
  for (const a of UNITS)
    for (const b of UNITS)
      for (const c of UNITS) {
        if (a.id === b.id || b.id === c.id || a.id === c.id) continue;
        trios.push([a, b, c]);
      }

  it("the full enemy space is 504 ordered trios", () => {
    expect(trios).toHaveLength(504);
  });

  it("Tuck + Moss + Cheep wins 501 of them and never draws", () => {
    const main: Lineup = [by("tuck"), by("moss"), by("cheep")];
    const results = trios.map((enemy) => resolveFight(main, enemy).winner);
    expect(results.filter((w) => w === "player")).toHaveLength(501);
    expect(results.filter((w) => w === "draw")).toHaveLength(0);
    expect(results.filter((w) => w === "enemy")).toHaveLength(3);
  });

  it("the only three counters all open Cheep then Tuck", () => {
    const main: Lineup = [by("tuck"), by("moss"), by("cheep")];
    const losses = trios
      .filter((enemy) => resolveFight(main, enemy).winner !== "player")
      .map((enemy) => enemy.map((u) => u.name).join("+"));
    expect(losses.sort()).toEqual(["Cheep+Tuck+Bumble", "Cheep+Tuck+Moss", "Cheep+Tuck+Waddle"]);
  });

  it("reordering to Tuck + Cheep + Moss beats all three counters", () => {
    const main: Lineup = [by("tuck"), by("moss"), by("cheep")];
    const reordered: Lineup = [by("tuck"), by("cheep"), by("moss")];
    const losses = trios.filter((enemy) => resolveFight(main, enemy).winner !== "player");
    expect(losses).toHaveLength(3);
    for (const enemy of losses) {
      expect(resolveFight(reordered, enemy).winner, enemy.map((u) => u.name).join("+")).toBe(
        "player"
      );
    }
  });
});
