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

/**
 * A cryptic clue is a promise: the enumeration counts the answer, the fodder of
 * an anagram holds exactly the answer's letters, and a hidden word is really
 * hidden in the surface. A clue that breaks one of those is unsolvable by
 * reasoning, and the only way to find out is to check the letters.
 */
describe("the clues are fair", () => {
  const letters = (text: string) => text.toUpperCase().replace(/[^A-Z]/g, "");
  const sorted = (text: string) => [...letters(text)].sort().join("");

  it("gives every clue a unique id and answer", () => {
    expect(new Set(CLUES.map((c) => c.id)).size).toBe(CLUES.length);
    expect(new Set(CLUES.map((c) => c.answer)).size).toBe(CLUES.length);
  });

  it("counts the answer correctly in the enumeration", () => {
    for (const clue of CLUES) {
      const stated = Number(clue.enumeration.replace(/[^0-9]/g, ""));
      expect(stated, `${clue.id} enumeration`).toBe(letters(clue.answer).length);
    }
  });

  it("hides the answer in the surface of every hidden-word clue", () => {
    const hidden = CLUES.filter((c) => c.device === "hidden");
    expect(hidden.length).toBeGreaterThan(0);
    for (const clue of hidden) {
      expect(letters(clue.clue), `${clue.id} surface`).toContain(letters(clue.answer));
    }
  });

  it("gives every anagram fodder exactly the answer's letters", () => {
    const anagrams = CLUES.filter((c) => c.device === "anagram");
    expect(anagrams.length).toBeGreaterThan(0);
    for (const clue of anagrams) {
      // The fodder is the quoted phrase in the surface.
      const quoted = /"([^"]+)"/.exec(clue.clue);
      expect(quoted, `${clue.id} should quote its fodder`).not.toBeNull();
      expect(sorted(quoted![1]!), `${clue.id} fodder`).toBe(sorted(clue.answer));
      expect(letters(quoted![1]!), `${clue.id} fodder is not the answer itself`).not.toBe(
        letters(clue.answer)
      );
    }
  });

  it("explains every clue in its annotation and names a device", () => {
    for (const clue of CLUES) {
      expect(clue.annotation.length, clue.id).toBeGreaterThan(30);
      expect(clue.device.length, clue.id).toBeGreaterThan(3);
      expect(clue.annotation.toUpperCase(), clue.id).toContain(letters(clue.answer));
    }
  });
});
