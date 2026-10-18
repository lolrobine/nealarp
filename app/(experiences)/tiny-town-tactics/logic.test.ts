import { describe, expect, it } from "vitest";
import {
  at,
  makeBoard,
  place,
  placementScore,
  PLACEMENTS,
  scoreRun,
  tileSequence,
  TILE_TYPES,
} from "./logic";

describe("tiny-town adjacency rules", () => {
  it("houses love parks and ponds and hate factories", () => {
    const board = makeBoard();
    expect(placementScore(board, 3, 3, "house")).toBe(1);
    const withPark = place(board, 3, 2, "park").board;
    expect(placementScore(withPark, 3, 3, "house")).toBe(4);
    const withFactory = place(board, 3, 2, "factory").board;
    expect(placementScore(withFactory, 3, 3, "house")).toBe(-1);
  });

  it("shops cluster and factories double down on factories", () => {
    const board = makeBoard();
    const withShop = place(board, 1, 1, "shop").board;
    expect(placementScore(withShop, 1, 2, "shop")).toBe(2);
    const withFactory = place(board, 5, 5, "factory").board;
    expect(placementScore(withFactory, 5, 6, "factory")).toBe(5);
  });

  it("ponds and parks complete each other", () => {
    const board = makeBoard();
    const withPond = place(board, 2, 2, "pond").board;
    expect(placementScore(withPond, 2, 3, "park")).toBe(3);
    expect(placementScore(withPond, 2, 3, "pond")).toBe(2);
  });
});

describe("tiny-town placement", () => {
  it("cannot overwrite a placed tile", () => {
    const first = place(makeBoard(), 0, 0, "house");
    expect(at(first.board, 0, 0)).toBe("house");
    const second = place(first.board, 0, 0, "pond");
    expect(second.gained).toBe(0);
    expect(at(second.board, 0, 0)).toBe("house");
  });

  it("sequences are deterministic and full length", () => {
    const a = tileSequence("town-a");
    const b = tileSequence("town-a");
    const c = tileSequence("town-b");
    expect(a).toEqual(b);
    expect(a).toHaveLength(PLACEMENTS);
    expect(a.every((t) => TILE_TYPES.includes(t))).toBe(true);
    expect(a).not.toEqual(c);
  });

  it("run scoring maps onto 0–100", () => {
    expect(scoreRun(0)).toBe(0);
    expect(scoreRun(320)).toBe(100);
    expect(scoreRun(160)).toBe(50);
    expect(scoreRun(-50)).toBe(0);
  });
});
