import { describe, expect, it } from "vitest";
import {
  barWidth,
  COLS,
  dropBlock,
  efficiency,
  landing,
  newRun,
  nudge,
  perfectPlay,
  scoreTower,
  slideX,
  step,
  upcoming,
  WIN_HEIGHT,
  type StackState,
} from "./logic";

describe("stack-ledger stacking", () => {
  it("shows every upcoming width — no hidden chance", () => {
    const state = newRun("seed-a");
    // The queue is fully determined by the seed and always inspectable.
    expect(state.queue.length).toBeGreaterThan(100);
    const again = newRun("seed-a");
    expect(again.queue).toEqual(state.queue);
    expect(upcoming(state, 6)).toEqual(state.queue.slice(1, 7));
    // Different seeds give different runs (not the same every game).
    expect(newRun("seed-b").queue).not.toEqual(state.queue);
  });

  it("landing rests the bar on the tallest column of its span", () => {
    const heights = Array<number>(COLS).fill(0);
    heights[3] = 2;
    heights[4] = 5;
    heights[5] = 2;
    const { contact, supported } = landing(heights, 3, 3);
    expect(contact).toBe(5);
    expect(supported).toEqual([false, true, false]);
  });

  it("drops rigidly: overhangs snap off, supported cells stack", () => {
    const state: StackState = { ...newRun("s"), heights: Array<number>(COLS).fill(0) };
    state.heights[4] = 2;
    state.heights[5] = 5;
    state.heights[6] = 2;
    state.queue = [3, 2, 2, 2, 2, 2, 2];
    state.x = 4;
    const next = dropBlock(state);
    // Only the cell over the tallest column is kept.
    expect(next.heights[4]).toBe(2);
    expect(next.heights[5]).toBe(6);
    expect(next.heights[6]).toBe(2);
    expect(next.kept).toBe(1);
    expect(next.lost).toBe(2);
    // The queue advanced: the next width is known and different piece.
    expect(barWidth(next)).toBe(2);
    expect(next.dropped).toBe(1);
    expect(efficiency(next)).toBeCloseTo(1 / 3);
  });

  it("a full flat landing keeps every cell and raises the whole span", () => {
    const state = newRun("flat");
    state.queue = [4, 2, 2, 2, 2, 2, 2];
    state.x = 3;
    const next = dropBlock(state);
    expect(next.heights.slice(3, 7)).toEqual([1, 1, 1, 1]);
    expect(next.lost).toBe(0);
    expect(efficiency(next)).toBe(1);
  });

  it("slides back and forth and can be nudged within the field", () => {
    const w = 3;
    expect(slideX(0, w)).toBe(0);
    expect(slideX(COLS - w, w)).toBe(COLS - w);
    expect(slideX(2 * (COLS - w), w)).toBe(0);
    const state = { ...newRun("n"), x: 0, tick: 0 };
    const right = nudge(state, 1);
    expect(right.x).toBe(1);
    const left = nudge({ ...right, x: 0 }, -1);
    expect(left.x).toBe(0);
    const stepped = step(state, 5);
    expect(stepped.tick).toBe(5);
    expect(stepped.x).toBe(slideX(5, barWidth(state)));
  });

  it("reaches the target with careful play — the game is beatable", () => {
    const result = perfectPlay("beat-me", 120);
    expect(result.phase).toBe("won");
    expect(Math.max(...result.heights)).toBeGreaterThanOrEqual(WIN_HEIGHT);
    expect(scoreTower(result.heights)).toBe(100);
    // Careful play keeps almost everything: the flat-span heuristic loses at most
    // a few overhang cells to ragged skylines.
    expect(efficiency(result)).toBeGreaterThan(0.5);
  });

  it("scores height on the 0-100 scale", () => {
    expect(scoreTower([0, 0])).toBe(0);
    expect(scoreTower([4, 2])).toBe(20);
    expect(scoreTower([WIN_HEIGHT, 1])).toBe(100);
    expect(scoreTower([99, 0])).toBe(100);
  });
});

/** The board animates the snapped-off overhang by re-reading landing(). If that ever
 *  disagreed with what dropBlock() books as lost, the animation would show pieces the
 *  ledger did not actually lose (or hide ones it did). */
describe("stack-ledger overhang is exactly what the animation draws", () => {
  it("counts the same cells as landing() reports unsupported", () => {
    let state = newRun("topple-seed");
    for (let drop = 0; drop < 12 && state.phase === "moving"; drop++) {
      // Shove the bar off-centre so overhang actually happens.
      const shifted = { ...state, x: Math.min(state.x + drop, COLS - barWidth(state)) };
      const { supported } = landing(shifted.heights, shifted.x, barWidth(shifted));
      const unsupported = supported.filter((s) => !s).length;
      const before = shifted.lost;
      const next = dropBlock(shifted);
      expect(next.lost - before, `drop ${drop}`).toBe(unsupported);
      state = next;
    }
  });

  it("a bar hanging over empty ground loses every unsupported cell", () => {
    const state = newRun("edge-seed");
    const width = barWidth(state);
    // Column 0 is flat ground, so a bar resting on a tall neighbour loses the rest.
    const heights = [...state.heights];
    heights[0] = 5;
    const { contact, supported } = landing(heights, 0, width);
    expect(contact).toBe(5);
    expect(supported[0]).toBe(true);
    expect(supported.slice(1).every((s) => !s)).toBe(true);
    const next = dropBlock({ ...state, heights, x: 0 });
    expect(next.lost).toBe(width - 1);
    expect(next.heights[0]).toBe(6);
  });
});
