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
      expect(new Set(bank).size, level.id).toBe(bank.length);
      for (const word of level.rows) expect(bank).toContain(word);
    }
  });

  /** The decoys are near-misses on purpose, which is exactly how this went wrong before:
   * "arm" completed pea/ear/arm, "ten" completed oat/are/ten and "rear" completed
   * star/tare/area/rear. Each of those is a genuine word square, so a player could build one,
   * press Check and be told they were wrong. Brute-force every ordering instead of trusting
   * the eye - with six words in a bank there are only 360 of them. */
  it("offers exactly one true square per bank, so no correct answer is rejected", () => {
    for (const level of SQUARES) {
      const found = orderings(bankWords(level), level.size).filter(isTrueSquare);
      expect(
        found.map((rows) => rows.join(" ")),
        level.id
      ).toEqual([level.rows.join(" ")]);
    }
  });
});

/** Every ordered selection of `size` words from the bank. */
function orderings(bank: string[], size: number): string[][] {
  if (size === 0) return [[]];
  return bank.flatMap((word, i) =>
    orderings(
      bank.filter((_, j) => j !== i),
      size - 1
    ).map((rest) => [word, ...rest])
  );
}

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

  it("needs every row, not just a matching column count", () => {
    // Two rows swapped keeps the same letters on the board but breaks the crossings.
    const swapped = evaluateRows(level, ["ape", "sap", "pea"]);
    expect(swapped.solved).toBe(false);
    expect(swapped.rowOk).toEqual([false, false, true]);
    // A short board can never be solved, even if what is there is right.
    expect(evaluateRows(level, ["sap", "ape"]).solved).toBe(false);
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
