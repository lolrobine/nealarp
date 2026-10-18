import { describe, expect, it } from "vitest";
import { applySlide, initialState, isWin, LEVELS, scoreRun, slide, type SlideState } from "./logic";

function shortestWin(level: (typeof LEVELS)[number], limit: number): number | null {
  const start = initialState(level);
  const key = (s: SlideState) => `${s.x},${s.y},${s.pi}`;
  const queue: { state: SlideState; depth: number }[] = [{ state: start, depth: 0 }];
  const seen = new Set([key(start)]);
  while (queue.length) {
    const { state, depth } = queue.shift()!;
    if (isWin(level, state)) return depth;
    if (depth >= limit) continue;
    for (let dir = 0; dir < 4; dir++) {
      const next = applySlide(level, state, dir);
      if (next === state) continue;
      const k = key(next);
      if (!seen.has(k)) {
        seen.add(k);
        queue.push({ state: next, depth: depth + 1 });
      }
    }
  }
  return null;
}

describe("ice-post levels", () => {
  it("ships ten levels with two-to-four step patrols", () => {
    expect(LEVELS).toHaveLength(10);
    for (const level of LEVELS) {
      expect(level.rows).toHaveLength(6);
      expect(level.patrol.length).toBeGreaterThanOrEqual(2);
      expect(level.patrol.length).toBeLessThanOrEqual(4);
    }
  });

  it("every authored solution delivers the post", () => {
    for (const level of LEVELS) {
      let state = initialState(level);
      for (const dir of level.solution) state = applySlide(level, state, dir);
      expect(isWin(level, state), level.name).toBe(true);
    }
  });

  it("pars equal the breadth-first shortest solutions", () => {
    for (const level of LEVELS) {
      const depth = shortestWin(level, level.par + 1);
      expect(depth, level.name).toBe(level.par);
    }
  });

  it("the postman blocks slides and advances after every move", () => {
    const level = LEVELS[0]!;
    const state = initialState(level);
    // Postman starts on patrol cell 0; a slide that would enter his cell stops short.
    const [nx, ny] = slide(level, state, 0);
    const postman = level.patrol[0]!;
    expect([nx, ny]).not.toEqual([postman.x, postman.y]);
    const moved = applySlide(level, state, 2);
    expect(moved.pi).toBe(1);
  });

  it("scores penalise moves beyond par", () => {
    expect(scoreRun(4, 4)).toBe(100);
    expect(scoreRun(6, 4)).toBe(92);
    expect(scoreRun(99, 4)).toBe(0);
  });
});
