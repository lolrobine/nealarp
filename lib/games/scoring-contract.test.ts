import { describe, it, expect } from "vitest";
import { scoreBlockTalk } from "@/app/(experiences)/block-talk/logic";
import { scoreClues } from "@/app/(experiences)/clue-school/logic";
import { scoreStreak as gateCrashStreak } from "@/app/(experiences)/gate-crash/logic";
import { golfScore } from "@/app/(experiences)/gravity-golf/logic";
import { scoreRun as icePostRun } from "@/app/(experiences)/ice-post/logic";
import { scoreStreak as laneGeneralStreak } from "@/app/(experiences)/lane-general/logic";
import { scoreRun as lavaLinksRun } from "@/app/(experiences)/lava-links/logic";
import { scoreRun as orbitOrchardRun } from "@/app/(experiences)/orbit-orchard/logic";
import { packingScore } from "@/app/(experiences)/pack-it-perfectly/logic";
import { discoveryScore } from "@/app/(experiences)/pocket-alchemist/logic";
import { scoreTower } from "@/app/(experiences)/stack-ledger/logic";
import { scoreRun as stockroomRun } from "@/app/(experiences)/stockroom-six/logic";
import { scoreRun as tinyTownRun } from "@/app/(experiences)/tiny-town-tactics/logic";
import { roomScore } from "@/app/(experiences)/twin-tilt/logic";
import { scoreSquare } from "@/app/(experiences)/word-square-studio/logic";
import {
  applyPlacement,
  emptyState,
  growboxScore,
  ITEMS as GROWBOX_ITEMS,
  type ItemId as GrowboxItemId,
} from "@/app/(experiences)/growbox/logic";

/**
 * Every game in this project reports out of 100, and WinScreen prints the
 * number straight into "n / 100". So a score function has one contract: a
 * whole number, never below zero, never above a hundred, never NaN.
 *
 * Most of them hold that with a Math.round inside a Math.min inside a
 * Math.max. The ones that did not were not obviously broken, which is the
 * problem: gravity golf clamped the floor but not the ceiling, and orbit
 * orchard divided by a ring count that a clamp cannot rescue, because NaN
 * passes through Math.min and Math.max untouched and lands in a personal
 * best. Neither input is reachable in normal play today. Both become
 * reachable the moment someone adds a level with no rings or lets a hole
 * record before the first shot.
 *
 * This checks the band across the catalogue rather than per game, so a new
 * scoring rule has to hold the line to land.
 */

/** Counts a player can plausibly rack up, plus a couple of silly ones. */
const COUNTS = [0, 1, 2, 3, 5, 8, 12, 20, 50, 100, 365, 10_000];

/** Signed amounts, for the games that score money rather than moves. */
const AMOUNTS = [...COUNTS, ...COUNTS.map((n) => -n)];

type Unary = (a: number) => number;
type Binary = (a: number, b: number) => number;

const UNARY: Record<string, [Unary, number[]]> = {
  "block-talk scoreBlockTalk": [scoreBlockTalk, COUNTS],
  "gate-crash scoreStreak": [gateCrashStreak, COUNTS],
  "gravity-golf golfScore": [golfScore, COUNTS],
  "pocket-alchemist discoveryScore": [discoveryScore, COUNTS],
  "stockroom-six scoreRun": [stockroomRun, AMOUNTS],
  "tiny-town-tactics scoreRun": [tinyTownRun, AMOUNTS],
};

const BINARY: Record<string, Binary> = {
  "clue-school scoreClues": scoreClues,
  "ice-post scoreRun": icePostRun,
  "lane-general scoreStreak": laneGeneralStreak,
  "lava-links scoreRun": lavaLinksRun,
  "orbit-orchard scoreRun": orbitOrchardRun,
  "pack-it-perfectly packingScore": packingScore,
  "twin-tilt roomScore": roomScore,
  "word-square-studio scoreSquare": scoreSquare,
};

function expectInBand(label: string, value: number) {
  expect(Number.isFinite(value), `${label} produced ${value}`).toBe(true);
  expect(Number.isInteger(value), `${label} produced ${value}`).toBe(true);
  expect(value, label).toBeGreaterThanOrEqual(0);
  expect(value, label).toBeLessThanOrEqual(100);
}

describe("every score lands between 0 and 100", () => {
  for (const [label, [fn, inputs]] of Object.entries(UNARY)) {
    it(label, () => {
      for (const a of inputs) expectInBand(`${label}(${a})`, fn(a));
    });
  }

  for (const [label, fn] of Object.entries(BINARY)) {
    it(label, () => {
      for (const a of COUNTS) {
        for (const b of COUNTS) expectInBand(`${label}(${a}, ${b})`, fn(a, b));
      }
    });
  }

  it("stack-ledger scoreTower", () => {
    const towers = [[], [0], [1, 2, 3], [20, 20, 20], [0, 0, 0, 0], COUNTS];
    for (const heights of towers) {
      expectInBand(`scoreTower([${heights.join(", ")}])`, scoreTower(heights));
    }
  });

  it("a zero denominator cannot poison a personal best", () => {
    // NaN survives Math.min and Math.max, so the clamp alone is not a guard.
    expectInBand("orbit-orchard scoreRun(0, 0)", orbitOrchardRun(0, 0));
    expectInBand("orbit-orchard scoreRun(3, 0)", orbitOrchardRun(3, 0));
  });
});

/**
 * Growbox scores a state rather than a number, which is why it sat outside the
 * tables above. Its state space is small enough to take whole: eight upgrades
 * means 40320 orders, and every one of them has to land in the band.
 */
describe("state-based scorers", () => {
  it("growbox growboxScore stays a whole number in 0-100 for every placement order", () => {
    const ids = GROWBOX_ITEMS.map((item) => item.id);
    const seen = new Set<number>();
    let orders = 0;

    const walk = (rest: GrowboxItemId[], acc: GrowboxItemId[]) => {
      if (rest.length === 0) {
        let state = emptyState();
        for (const id of acc) state = applyPlacement(state, id);
        const score = growboxScore(state);
        expect(Number.isInteger(score), `order ${acc.join(">")} scored ${score}`).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        seen.add(score);
        orders += 1;
        return;
      }
      for (let i = 0; i < rest.length; i += 1) {
        walk([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, rest[i]!]);
      }
    };
    walk(ids, []);

    expect(orders).toBe(40_320);
    // A scorer that answered the same thing for every order would pass the
    // band check and tell the player nothing.
    expect(seen.size).toBeGreaterThan(1);
    expect(Math.max(...seen)).toBe(100);
  });
});
