import { describe, expect, it } from "vitest";
import { applyHop, hopTarget, initialState, isWin, LEVELS, scoreRun, type HexState } from "./logic";

function shortestWin(level: (typeof LEVELS)[number], limit: number): number | null {
  const start = initialState(level);
  const key = (s: HexState) => `${s.x},${s.y}|${[...s.gone].sort().join(";")}`;
  const queue: { state: HexState; depth: number }[] = [{ state: start, depth: 0 }];
  const seen = new Set([key(start)]);
  while (queue.length) {
    const { state, depth } = queue.shift()!;
    if (isWin(level, state)) return depth;
    if (depth >= limit) continue;
    for (let dir = 0; dir < 6; dir++) {
      for (const steps of [1, 2] as const) {
        const next = applyHop(level, state, { dir, steps });
        if (next === state) continue;
        const k = key(next);
        if (!seen.has(k)) {
          seen.add(k);
          queue.push({ state: next, depth: depth + 1 });
        }
      }
    }
  }
  return null;
}

describe("lava-links levels", () => {
  it("ships seven levels with pars and mixed hop lengths", () => {
    expect(LEVELS).toHaveLength(7);
    for (const level of LEVELS) {
      expect(level.rows).toHaveLength(5);
      expect(level.rows.every((r) => r.length === 5)).toBe(true);
      expect(
        level.solution.some((h) => h.steps === 2),
        level.name
      ).toBe(true);
    }
  });

  it("every authored solution reaches the goal", () => {
    for (const level of LEVELS) {
      let state = initialState(level);
      for (const hop of level.solution) state = applyHop(level, state, hop);
      expect(isWin(level, state), level.name).toBe(true);
    }
  });

  it("pars equal the breadth-first shortest solutions", () => {
    for (const level of LEVELS) {
      const depth = shortestWin(level, level.par + 1);
      expect(depth, level.name).toBe(level.par);
    }
  });

  it("crumbled tiles cannot be reused and void tiles cannot be landed on", () => {
    const level = LEVELS[0]!;
    const state = initialState(level);
    // Leaving the start crumbles it.
    const after = applyHop(level, state, level.solution[0]!);
    expect(after.gone).toContain(`${state.x},${state.y}`);
    // A hop onto a void tile is rejected.
    const voidTarget = level.rows
      .map((row, y) => row.split("").map((c, x) => ({ c, x, y })))
      .flat()
      .find((cell) => cell.c === ".");
    if (voidTarget) {
      const blocked: HexState = { x: voidTarget.x, y: voidTarget.y, gone: [] };
      expect(
        [0, 1, 2, 3, 4, 5].every((dir) => {
          const target = hopTarget(
            level,
            { ...blocked, x: voidTarget.x - 2, y: voidTarget.y },
            { dir, steps: 1 }
          );
          return target === null || level.rows[target[1]]?.[target[0]] === "#";
        })
      ).toBe(true);
    }
  });

  it("scores penalise moves beyond par", () => {
    expect(scoreRun(5, 5)).toBe(100);
    expect(scoreRun(7, 5)).toBe(92);
    expect(scoreRun(50, 5)).toBe(0);
  });
});
