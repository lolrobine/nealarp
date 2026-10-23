import { describe, expect, it } from "vitest";
import { canPlace, LEVELS, occupied, packingScore, rotate, type Cell } from "./logic";

describe("rotate", () => {
  it("returns to the original shape after four quarter turns", () => {
    const L: Cell[] = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    expect(new Set(rotate(L, 4).map(String))).toEqual(new Set(L.map(String)));
  });

  it("keeps every rotation flush against the origin, so placement maths stays simple", () => {
    for (const piece of LEVELS.flatMap((l) => l.pieces)) {
      for (let turns = 0; turns < 4; turns++) {
        const cells = rotate(piece.cells, turns);
        expect(Math.min(...cells.map((c) => c[0]))).toBe(0);
        expect(Math.min(...cells.map((c) => c[1]))).toBe(0);
      }
    }
  });

  it("never loses or duplicates a cell", () => {
    for (const piece of LEVELS.flatMap((l) => l.pieces)) {
      for (let turns = 0; turns < 4; turns++) {
        const cells = rotate(piece.cells, turns);
        expect(cells).toHaveLength(piece.cells.length);
        expect(new Set(cells.map(String)).size).toBe(piece.cells.length);
      }
    }
  });

  it("treats negative turns the same as the equivalent positive ones", () => {
    const piece = LEVELS[1]!.pieces[0]!.cells;
    expect(rotate(piece, -1).map(String).sort()).toEqual(rotate(piece, 3).map(String).sort());
  });
});

describe("the packed levels", () => {
  it.each(LEVELS.map((l) => [l.name, l] as const))(
    "%s has pieces that exactly fill the bag, with no slack and no overflow",
    (_name, level) => {
      const area = level.pieces.reduce((sum, p) => sum + p.cells.length, 0);
      expect(area).toBe(level.width * level.height);
    }
  );

  it.each(LEVELS.map((l) => [l.name, l] as const))(
    "%s ships a solution that is actually legal move by move",
    (_name, level) => {
      const placed: typeof level.solution = [];
      for (const move of level.solution) {
        expect(canPlace(level, placed, move), `${move.id} does not fit`).toBe(true);
        placed.push(move);
      }
      expect(occupied(level, placed).size).toBe(level.width * level.height);
    }
  );

  it.each(LEVELS.map((l) => [l.name, l] as const))(
    "%s names every piece in its solution exactly once",
    (_name, level) => {
      expect(level.solution.map((s) => s.id).sort()).toEqual(level.pieces.map((p) => p.id).sort());
    }
  );
});

describe("canPlace", () => {
  const level = LEVELS[0]!;

  it("refuses a piece that hangs off the edge", () => {
    expect(canPlace(level, [], { id: "C", x: 1, y: 0, rotation: 0 })).toBe(false);
    expect(canPlace(level, [], { id: "A", x: 0, y: 2, rotation: 0 })).toBe(false);
  });

  it("refuses negative coordinates", () => {
    expect(canPlace(level, [], { id: "A", x: -1, y: 0, rotation: 0 })).toBe(false);
  });

  it("refuses to overlap a piece already in the bag", () => {
    const first = { id: "A", x: 0, y: 0, rotation: 0 };
    expect(canPlace(level, [first], { id: "B", x: 1, y: 0, rotation: 0 })).toBe(false);
    expect(canPlace(level, [first], { id: "B", x: 2, y: 0, rotation: 0 })).toBe(true);
  });

  it("refuses to pack the same piece twice", () => {
    const first = { id: "A", x: 0, y: 0, rotation: 0 };
    expect(canPlace(level, [first], { id: "A", x: 2, y: 0, rotation: 0 })).toBe(false);
  });

  it("refuses an unknown piece and fractional coordinates", () => {
    expect(canPlace(level, [], { id: "Z", x: 0, y: 0, rotation: 0 })).toBe(false);
    expect(canPlace(level, [], { id: "A", x: 0.5, y: 0, rotation: 0 })).toBe(false);
  });
});

describe("packingScore", () => {
  it("pays full marks for a run with no wasted move", () => {
    expect(packingScore(3, 3)).toBe(100);
  });

  it("docks five per extra move and never reports outside 0-100", () => {
    expect(packingScore(4, 3)).toBe(95);
    expect(packingScore(8, 3)).toBe(75);
    for (let moves = 0; moves <= 60; moves++) {
      const score = packingScore(moves, 3);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("does not reward finishing in fewer moves than there are pieces", () => {
    expect(packingScore(1, 3)).toBe(100);
  });
});
