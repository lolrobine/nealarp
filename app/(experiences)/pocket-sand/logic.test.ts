import { describe, expect, it } from "vitest";
import { at, GOALS, makeGrid, SAND, sandScore, set, step, WALL, WATER, W } from "./logic";

describe("pocket-sand simulation", () => {
  it("sand falls straight down onto open floor", () => {
    const grid = makeGrid();
    set(grid, 10, 0, SAND);
    const next = step(grid);
    expect(at(next, 10, 0)).toBe(0);
    expect(at(next, 10, 1)).toBe(SAND);
  });

  it("sand piles up and slides off a wall", () => {
    const grid = makeGrid();
    set(grid, 20, 30, SAND);
    set(grid, 20, 31, SAND);
    set(grid, 20, 31, WALL);
    set(grid, 20, 30, SAND);
    const next = step(grid);
    // Blocked below, the grain slides diagonally left first (deterministic sweep).
    expect(at(next, 19, 31)).toBe(SAND);
  });

  it("sand sinks through water and water spreads sideways", () => {
    const grid = makeGrid();
    set(grid, 5, 30, SAND);
    set(grid, 5, 31, WATER);
    const afterSand = step(grid);
    expect(at(afterSand, 5, 31)).toBe(SAND);
    expect(at(afterSand, 5, 30)).toBe(WATER);

    const waterOnly = makeGrid();
    set(waterOnly, 8, 31, WATER);
    const spread = step(waterOnly);
    // Floor water cannot fall, so it spreads one cell sideways (deterministic side).
    expect(at(spread, 8, 31)).toBe(0);
    const neighbours = [at(spread, 7, 31), at(spread, 9, 31)];
    expect(neighbours.some((m) => m === WATER)).toBe(true);
  });

  it("simulation is deterministic", () => {
    const grid = makeGrid();
    set(grid, 12, 5, SAND);
    set(grid, 13, 6, SAND);
    set(grid, 14, 7, WATER);
    const a = step(step(step(grid)));
    const b = step(step(step(grid)));
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it("bounds keep the grid intact", () => {
    const grid = makeGrid();
    set(grid, -5, 3, SAND);
    set(grid, W + 2, 3, SAND);
    expect(grid.every((m) => m === 0)).toBe(true);
  });
});

describe("pocket-sand goals", () => {
  it("ships six goals with on-board target cells", () => {
    expect(GOALS).toHaveLength(6);
    for (const goal of GOALS) {
      expect(goal.cells.length, goal.id).toBeGreaterThan(3);
      for (const [x, y] of goal.cells) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(W);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(32);
      }
    }
  });

  it("scoring rewards a perfect sculpt and rejects empty boards", () => {
    const goal = GOALS[0]!;
    const perfect = makeGrid();
    for (const [x, y] of goal.cells) set(perfect, x, y, SAND);
    expect(sandScore(perfect, goal)).toBe(100);
    expect(sandScore(makeGrid(), goal)).toBe(0);
  });

  it("stray sand costs precision", () => {
    const goal = GOALS.find((g) => g.id === "shoreline")!;
    const perfect = makeGrid();
    for (const [x, y] of goal.cells) set(perfect, x, y, SAND);
    const stray = perfect.slice();
    set(stray, 2, 2, SAND);
    set(stray, 40, 10, SAND);
    expect(sandScore(stray, goal)).toBeLessThan(sandScore(perfect, goal));
    expect(sandScore(stray, goal)).toBeGreaterThan(50);
  });
});
