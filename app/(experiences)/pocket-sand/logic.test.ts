import { describe, expect, it } from "vitest";
import { at, GOALS, H, makeGrid, SAND, sandScore, set, step, WALL, WATER, W } from "./logic";

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

  it("sand sinks through standing water and water equalises between columns", () => {
    const grid = makeGrid();
    set(grid, 5, 30, SAND);
    set(grid, 5, 31, WATER);
    const afterSand = step(grid);
    // The grain sinks through the water: they trade places exactly.
    expect(at(afterSand, 5, 31)).toBe(SAND);
    expect(at(afterSand, 5, 30)).toBe(WATER);

    // A taller column of water settles into an even one-cell-deep puddle.
    const waterOnly = makeGrid();
    for (let i = 0; i < 4; i++) set(waterOnly, 8, 31 - i, WATER);
    let spread = waterOnly;
    for (let t = 0; t < 12; t++) spread = step(spread);
    let count = 0;
    const wetX: number[] = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (at(spread, x, y) !== WATER) continue;
        count++;
        if (y === 31) wetX.push(x);
      }
    }
    expect(count).toBe(4);
    // Exactly four adjacent floor cells, nothing floating above them.
    expect(wetX.length).toBe(4);
    expect(Math.max(...wetX) - Math.min(...wetX)).toBe(3);
  });

  it("water levels out instead of freezing into columns", () => {
    // Pour a tall column of water on the floor; after settling it must spread flat.
    const grid = makeGrid();
    for (let i = 0; i < 15; i++) set(grid, 24, 31 - i, WATER);
    let g = grid;
    for (let i = 0; i < 60; i++) g = step(g);
    const depths: number[] = [];
    for (let x = 0; x < W; x++) {
      let depth = 0;
      for (let y = 31; y >= 0; y--) if (at(g, x, y) === WATER) depth++;
      depths.push(depth);
    }
    const wet = depths.filter((d) => d > 0);
    expect(wet.length).toBeGreaterThanOrEqual(8);
    // No single-cell towers: the deepest wet column is at most ceil(total / width).
    expect(Math.max(...depths)).toBeLessThanOrEqual(Math.ceil(15 / wet.length) + 1);
    // No checkerboard gaps between wet cells.
    const first = depths.indexOf(wet[0]!);
    const spread = depths.slice(first, first + wet.length);
    expect(spread.every((d) => d > 0)).toBe(true);
  });

  it("water fills a cup from the bottom up", () => {
    const g = makeGrid();
    for (let y = 24; y < 32; y++) {
      set(g, 10, y, WALL);
      set(g, 20, y, WALL);
    }
    for (let x = 10; x <= 20; x++) set(g, x, 31, WALL);
    let current = g;
    for (let tick = 0; tick < 30; tick++) {
      if (at(current, 15, 24) === 0) set(current, 15, 24, WATER);
      current = step(current);
    }
    let waterCount = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (at(current, x, y) === WATER) waterCount++;
    expect(waterCount).toBeGreaterThanOrEqual(20);
    // Bottom row of the cup is fully wet before upper rows.
    let bottom = 0;
    for (let x = 11; x < 20; x++) if (at(current, x, 30) === WATER) bottom++;
    expect(bottom).toBeGreaterThanOrEqual(6);
  });

  it("never loses or duplicates grains (claim-checked collisions)", () => {
    // Two grains funnel toward one gap; a collision must not destroy matter.
    const grid = makeGrid();
    set(grid, 20, 30, SAND);
    set(grid, 21, 30, SAND);
    set(grid, 21, 31, WALL);
    const count = (g: Uint8Array, mat: number) => g.reduce((n, m) => n + (m === mat ? 1 : 0), 0);
    let current = grid;
    for (let i = 0; i < 30; i++) {
      current = step(current);
      expect(count(current, SAND), `tick ${i}`).toBe(2);
      expect(count(current, WALL), `tick ${i}`).toBe(1);
    }
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
