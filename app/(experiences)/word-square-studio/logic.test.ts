import { describe, expect, it } from "vitest";
import {
  bankWords,
  evaluateRows,
  isTrueSquare,
  scoreSquare,
  SQUARES,
  transposeRows,
} from "./logic";

describe("word-square-studio levels", () => {
  it("ships ten solvable true word squares", () => {
    expect(SQUARES).toHaveLength(10);
    for (const level of SQUARES) {
      expect(level.rows).toHaveLength(level.size);
      expect(isTrueSquare(level.rows), level.id).toBe(true);
      // The mirror reading is the same square for a true word square.
      expect(transposeRows(level.rows)).toEqual(level.rows);
    }
  });

  it("banks hold only the square words plus distractors", () => {
    for (const level of SQUARES) {
      const bank = bankWords(level);
      expect(bank).toHaveLength(level.size + level.distractors.length);
      for (const word of level.rows) expect(bank).toContain(word);
    }
  });
});

describe("evaluateRows", () => {
  const level = SQUARES.find((s) => s.id === "sap")!;

  it("recognises the placed solution", () => {
    const result = evaluateRows(level, ["sap", "ape", "pea"]);
    expect(result.solved).toBe(true);
    expect(result.rowOk).toEqual([true, true, true]);
  });

  it("reports partial correctness and rejects a scramble", () => {
    const partial = evaluateRows(level, ["sap", "pea", null]);
    expect(partial.rowOk).toEqual([true, false, false]);
    expect(partial.solved).toBe(false);
    const scramble = evaluateRows(level, ["oat", "tar", "sap"]);
    expect(scramble.solved).toBe(false);
  });

  it("accepts the mirror reading of the square", () => {
    const mirrored = transposeRows(level.rows);
    const result = evaluateRows(level, mirrored);
    expect(result.solved).toBe(true);
  });
});

describe("scoreSquare", () => {
  it("starts at 100 and clamps at zero", () => {
    expect(scoreSquare(0, 0)).toBe(100);
    expect(scoreSquare(1, 0)).toBe(94);
    expect(scoreSquare(1, 1)).toBe(91);
    expect(scoreSquare(50, 20)).toBe(0);
  });
});
