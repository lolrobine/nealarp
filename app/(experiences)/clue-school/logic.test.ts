import { describe, expect, it } from "vitest";
import { CLUES } from "./data";
import { isCorrect, normalizeGuess, scoreClues } from "./logic";

describe("clue-school content", () => {
  it("ships eight original clues with annotations and devices", () => {
    expect(CLUES).toHaveLength(8);
    for (const level of CLUES) {
      expect(level.answer.length, level.id).toBeGreaterThan(3);
      expect(level.annotation.length, level.id).toBeGreaterThan(30);
      expect(level.clue.length, level.id).toBeGreaterThan(10);
    }
  });

  it("every hidden-word clue actually hides its answer in the surface text", () => {
    for (const level of CLUES.filter((l) => l.device === "hidden")) {
      const stripped = level.clue.toLowerCase().replace(/[^a-z]/g, "");
      expect(stripped.includes(level.answer.toLowerCase()), level.id).toBe(true);
    }
  });

  it("every anagram clue's fodder letters match its answer", () => {
    const counts = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z]/g, "")
        .split("")
        .sort()
        .join("");
    for (const level of CLUES.filter((l) => l.device === "anagram")) {
      // The first quoted phrase in the annotation is the fodder.
      const quoted = level.annotation.match(/"([^"]+)"/)?.[1] ?? "";
      expect(counts(quoted), level.id).toBe(counts(level.answer));
    }
  });

  it("charade clues concatenate to the answer", () => {
    for (const level of CLUES.filter((l) => l.device === "charade")) {
      const parts = level.annotation.match(/([A-Z]+) \([^)]*\) \+ ([A-Z]+)/);
      expect(parts, level.id).not.toBeNull();
      expect(parts![1]! + parts![2]!, level.id).toBe(level.answer);
    }
  });
});

describe("guessing and scoring", () => {
  it("normalises guesses and matches answers", () => {
    expect(normalizeGuess("  Planet! ")).toBe("planet");
    expect(isCorrect(CLUES[0]!, "planet")).toBe(true);
    expect(isCorrect(CLUES[0]!, "PLANET")).toBe(true);
    expect(isCorrect(CLUES[0]!, "planetoid")).toBe(false);
  });

  it("score drops with wrong attempts and hints, clamped at zero", () => {
    expect(scoreClues(0, 0)).toBe(100);
    expect(scoreClues(1, 0)).toBe(92);
    expect(scoreClues(0, 1)).toBe(88);
    expect(scoreClues(30, 10)).toBe(0);
  });
});
