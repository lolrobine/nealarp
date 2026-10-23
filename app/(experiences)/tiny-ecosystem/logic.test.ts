import { describe, expect, it } from "vitest";
import {
  clamp,
  ecosystemScore,
  ecosystemStep,
  INITIAL_ECOSYSTEM,
  isAlive,
  type Ecosystem,
} from "./logic";

const MAXIMUM = { plants: 120, herbivores: 30, predators: 12 } as const;
type Species = keyof typeof MAXIMUM;
/** The moves the page offers: planting adds ten, everything else moves by one. */
const MOVES: [Species, number][] = [
  ["plants", 10],
  ["plants", -1],
  ["herbivores", 1],
  ["herbivores", -1],
  ["predators", 1],
  ["predators", -1],
];

function intervene(state: Ecosystem, [key, amount]: [Species, number]): Ecosystem | null {
  const next = clamp(state[key] + amount, 0, MAXIMUM[key]);
  return next === state[key] ? null : { ...state, [key]: next };
}

/** Plays twelve rounds, applying the given moves before the listed round. */
function play(plan: Map<number, [Species, number][]>): number {
  let state = INITIAL_ECOSYSTEM;
  for (let round = 0; round < 12; round++) {
    for (const move of plan.get(round) ?? []) {
      const next = intervene(state, move);
      if (!next) return -1;
      state = next;
    }
    if (!isAlive(state)) return state.round;
    const stepped = ecosystemStep(state);
    if (!isAlive(stepped)) return state.round;
    state = stepped;
  }
  return state.round;
}

describe("ecosystemStep", () => {
  it("is pure: the same input always gives the same output", () => {
    const once = ecosystemStep(INITIAL_ECOSYSTEM);
    expect(ecosystemStep(INITIAL_ECOSYSTEM)).toEqual(once);
  });

  it("does not mutate the state it was handed", () => {
    const before = { ...INITIAL_ECOSYSTEM };
    ecosystemStep(INITIAL_ECOSYSTEM);
    expect(INITIAL_ECOSYSTEM).toEqual(before);
  });

  it("advances the round by exactly one", () => {
    expect(ecosystemStep(INITIAL_ECOSYSTEM).round).toBe(1);
  });

  it("keeps every population inside its ceiling and off negative numbers", () => {
    let state: Ecosystem = { plants: 120, herbivores: 30, predators: 12, round: 0 };
    for (let i = 0; i < 40; i++) {
      state = ecosystemStep(state);
      expect(state.plants).toBeGreaterThanOrEqual(0);
      expect(state.plants).toBeLessThanOrEqual(120);
      expect(state.herbivores).toBeGreaterThanOrEqual(0);
      expect(state.herbivores).toBeLessThanOrEqual(30);
      expect(state.predators).toBeGreaterThanOrEqual(0);
      expect(state.predators).toBeLessThanOrEqual(12);
    }
  });

  it("starves the herbivores once the plants run short", () => {
    const starving = ecosystemStep({ plants: 5, herbivores: 10, predators: 1, round: 0 });
    expect(starving.herbivores).toBeLessThan(10);
  });

  it("refuses an impossible state rather than quietly producing nonsense", () => {
    expect(() => ecosystemStep({ plants: -1, herbivores: 5, predators: 1, round: 0 })).toThrow();
    expect(() => ecosystemStep({ plants: NaN, herbivores: 5, predators: 1, round: 0 })).toThrow();
  });
});

describe("the opening position is a problem to solve", () => {
  it("collapses in round 6 if the player never intervenes", () => {
    expect(play(new Map())).toBe(6);
  });

  it("can be rescued by a single well-chosen intervention", () => {
    const rescues = MOVES.filter((move) => play(new Map([[0, [move]]])) === 12);
    expect(rescues.length).toBeGreaterThan(0);
  });

  it("has many rescues rather than one, so it forgives an imperfect read", () => {
    let survivable = 0;
    for (let round = 0; round < 12; round++) {
      for (const move of MOVES) {
        if (play(new Map([[round, [move]]])) === 12) survivable++;
      }
    }
    expect(survivable).toBeGreaterThanOrEqual(15);
  });

  it("can be saved by acting on any of the three populations", () => {
    const species = new Set<Species>();
    for (let round = 0; round < 12; round++) {
      for (const move of MOVES) {
        if (play(new Map([[round, [move]]])) === 12) species.add(move[0]);
      }
    }
    expect([...species].sort()).toEqual(["herbivores", "plants", "predators"]);
  });

  it("fits the two interventions the page actually grants", () => {
    expect(play(new Map([[0, [MOVES[0]!, MOVES[0]!]]]))).toBe(12);
  });
});

describe("isAlive", () => {
  it("needs all three populations present", () => {
    expect(isAlive({ plants: 10, herbivores: 2, predators: 1, round: 3 })).toBe(true);
    expect(isAlive({ plants: 0, herbivores: 2, predators: 1, round: 3 })).toBe(false);
    expect(isAlive({ plants: 10, herbivores: 0.5, predators: 1, round: 3 })).toBe(false);
    expect(isAlive({ plants: 10, herbivores: 2, predators: 0, round: 3 })).toBe(false);
  });
});

describe("ecosystemScore", () => {
  it("pays the full hundred only for the full twelve rounds", () => {
    expect(ecosystemScore({ ...INITIAL_ECOSYSTEM, round: 12 })).toBe(100);
    expect(ecosystemScore({ ...INITIAL_ECOSYSTEM, round: 6 })).toBe(50);
    expect(ecosystemScore({ ...INITIAL_ECOSYSTEM, round: 0 })).toBe(0);
  });

  it("stays inside 0-100 even past the finish", () => {
    for (let round = 0; round <= 30; round++) {
      const score = ecosystemScore({ ...INITIAL_ECOSYSTEM, round });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("now separates a player who acts from one who only clicks through", () => {
    // Doing nothing dies in round 6, which is half marks, not full.
    expect(ecosystemScore({ ...INITIAL_ECOSYSTEM, round: play(new Map()) })).toBeLessThan(100);
  });
});
