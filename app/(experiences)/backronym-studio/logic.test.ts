import { describe, expect, it } from "vitest";
import {
  CONSTRAINTS,
  coverage,
  dailyLetters,
  LETTER_POOLS,
  scoreBackronym,
  splitWords,
} from "./logic";

describe("backronym word analysis", () => {
  it("splits words on punctuation and case", () => {
    expect(splitWords("Quick, brown  FOX!")).toEqual(["quick", "brown", "fox"]);
    expect(splitWords("")).toEqual([]);
  });

  it("counts in-order letter coverage as a subsequence", () => {
    expect(coverage(["sun", "pear", "arm"], "spa")).toBe(3);
    expect(coverage(["sun", "pear", "arm"], "spr")).toBe(2);
    expect(coverage(["tulip", "ugly", "lemon", "ipad"], "tuli")).toBe(4);
    expect(coverage([], "abc")).toBe(0);
  });
});

describe("constraint cards", () => {
  const letters = "spark";

  it("ordered-letters needs full coverage", () => {
    const card = CONSTRAINTS.find((c) => c.id === "ordered-letters")!;
    expect(card.check(["sparrows", "play", "are", "rhyme", "king"], letters)).toBe(true);
    expect(card.check(["sparrows", "playing"], letters)).toBe(false);
  });

  it("word-length rejects short words", () => {
    const card = CONSTRAINTS.find((c) => c.id === "word-length")!;
    expect(card.check(["four", "five", "nine"], letters)).toBe(true);
    expect(card.check(["four", "a", "nine"], letters)).toBe(false);
  });

  it("long-words wants two words of six or more letters", () => {
    const card = CONSTRAINTS.find((c) => c.id === "long-words")!;
    expect(card.check(["silver", "golden", "tin"], letters)).toBe(true);
    expect(card.check(["silver", "gold", "tin"], letters)).toBe(false);
  });

  it("no-repeat catches duplicates", () => {
    const card = CONSTRAINTS.find((c) => c.id === "no-repeat")!;
    expect(card.check(["alpha", "beta"], letters)).toBe(true);
    expect(card.check(["alpha", "beta", "alpha"], letters)).toBe(false);
  });

  it("word-count wants four to eight words", () => {
    const card = CONSTRAINTS.find((c) => c.id === "word-count")!;
    expect(card.check(["a", "b", "c", "d"], letters)).toBe(true);
    expect(card.check(["a", "b", "c"], letters)).toBe(false);
    expect(card.check(Array(9).fill("word"), letters)).toBe(false);
  });

  it("bookends checks first and last word initials", () => {
    const card = CONSTRAINTS.find((c) => c.id === "bookends")!;
    expect(card.check(["sky", "purple", "arc", "super", "kite"], letters)).toBe(true);
    expect(card.check(["sky", "purple", "arc"], letters)).toBe(false);
    expect(card.check(["sky"], letters)).toBe(false);
  });
});

describe("scoreBackronym", () => {
  it("empty text scores zero", () => {
    const result = scoreBackronym("spark", "   ");
    expect(result.total).toBe(0);
  });

  it("a full phrase hits every rubric band", () => {
    const result = scoreBackronym(
      "spark",
      "Silent poets always rhyme, keeping",
      CONSTRAINTS.map((c) => c.id)
    );
    expect(result.coverage).toBe(5);
    expect(result.coveragePoints).toBe(40);
    expect(result.constraintPoints).toBe(30);
    expect(result.total).toBeGreaterThanOrEqual(85);
  });

  it("partial coverage lands between the extremes", () => {
    const result = scoreBackronym("spark", "Silent poets are rhyming");
    expect(result.coverage).toBe(4);
    expect(result.coveragePoints).toBe(32);
    expect(result.total).toBeGreaterThan(20);
    expect(result.total).toBeLessThan(85);
  });

  it("scoring is deterministic", () => {
    const a = scoreBackronym("charm", "Cats hate angry roaming mice");
    const b = scoreBackronym("charm", "Cats hate angry roaming mice");
    expect(a).toEqual(b);
  });
});

describe("daily letters", () => {
  it("stays within the published pool and is date-stable", () => {
    const date = new Date("2026-10-18T12:00:00Z");
    expect(LETTER_POOLS).toHaveLength(10);
    expect(dailyLetters(date)).toBe(dailyLetters(date));
    expect(LETTER_POOLS).toContain(dailyLetters(date));
  });
});
