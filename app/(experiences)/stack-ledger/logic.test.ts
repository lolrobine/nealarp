import { describe, expect, it } from "vitest";
import {
  BLOCK_W,
  canDrop,
  dropBlock,
  newRun,
  scoreTower,
  step,
  swingX,
  TOPPLE_TOLERANCE,
  WIN_HEIGHT,
} from "./logic";

describe("stack-ledger pendulum", () => {
  it("swing stays inside the arena and moves smoothly per tick", () => {
    for (let t = 0; t < 500; t += 7) {
      const x = swingX(t);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
    }
    expect(swingX(0)).toBeCloseTo(0.5, 5);
  });
});

describe("stack-ledger drop rules", () => {
  it("first drop always lands and starts the tower", () => {
    const state = dropBlock(newRun("test-seed"));
    expect(state.placed).toHaveLength(1);
    expect(state.alive).toBe(true);
    expect(state.dropped).toBe(1);
  });

  it("a centred drop of a legal number keeps the tower alive", () => {
    let state = newRun("tower-a");
    state = dropBlock(state);
    // Force the pendulum to the top block's x for an ideal landing.
    const top = state.placed[0]!;
    const aligned = { ...state, tick: Math.round(Math.asin((top.x - 0.5) / 0.32) / 0.018) };
    const legal = aligned.nextN <= top.n ? aligned : { ...aligned, nextN: top.n };
    const next = dropBlock(legal);
    if (Math.abs(swingX(legal.tick) - top.x) <= TOPPLE_TOLERANCE) {
      expect(next.alive).toBe(true);
      expect(next.placed).toHaveLength(2);
    }
  });

  it("a block with a number above the top is rejected before dropping", () => {
    let state = newRun("tower-b");
    state = dropBlock(state);
    const top = state.placed[0]!;
    const illegal = { ...state, nextN: top.n + 1 };
    const gate = canDrop(illegal);
    expect(gate.ok).toBe(false);
    const after = dropBlock(illegal);
    expect(after.placed).toHaveLength(1);
    expect(after.dropped).toBe(1);
  });

  it("an off-centre drop topples the tower", () => {
    let state = newRun("tower-c");
    state = dropBlock(state);
    const top = state.placed[0]!;
    // Find a tick where the pendulum is far from the top block.
    let tick = state.tick;
    for (let t = 0; t < 10000; t++) {
      if (Math.abs(swingX(t) - top.x) > TOPPLE_TOLERANCE + 0.05) {
        tick = t;
        break;
      }
    }
    const legal = { ...state, tick, nextN: Math.min(state.nextN, top.n) };
    const next = dropBlock(legal);
    expect(next.alive).toBe(false);
    expect(next.placed).toHaveLength(1);
  });

  it("scoring is linear and clamped", () => {
    expect(scoreTower(0)).toBe(0);
    expect(scoreTower(5)).toBe(25);
    expect(scoreTower(WIN_HEIGHT)).toBe(100);
    expect(scoreTower(100)).toBe(100);
  });

  it("step advances ticks without touching the score", () => {
    const state = step(newRun("tower-d"), 30);
    expect(state.tick).toBe(30);
    expect(state.placed).toHaveLength(0);
  });

  it("block width constant is sane", () => {
    expect(BLOCK_W).toBeGreaterThan(0.1);
    expect(BLOCK_W).toBeLessThan(0.5);
  });
});
