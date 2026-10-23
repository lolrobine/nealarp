import { describe, expect, it } from "vitest";
import { dailyQuestions, isCorrect, QUESTIONS, type Question } from "./logic";

const YEAR = Array.from({ length: 365 }, (_, i) =>
  new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
);

/**
 * Work the prompt out from its own words.
 *
 * Every question states a situation in text and then repeats the answer as a number the game
 * compares. Nothing stops those two from drifting apart: a new question with a mistyped `a`
 * would mark the right answer wrong, and no amount of playing would reveal which half was
 * lying. So the test does the arithmetic from the prompt instead of trusting the number.
 */
function valueOf(prompt: string): number {
  const body = prompt.slice(prompt.indexOf(":") + 1).trim();
  const num = (s: string) => Number(s.replace(",", "."));

  let m = /^([\d.]+)\s*(m|km)\s+in\s+([\d.]+)\s*s$/.exec(body);
  if (m) return (num(m[1]!) * (m[2] === "km" ? 1000 : 1)) / num(m[3]!);

  m = /^([\d.]+)\s*km\/h$/.exec(body);
  if (m) return num(m[1]!) / 3.6;

  m = /^([\d.]+)\s*m\/s$/.exec(body);
  if (m) return num(m[1]!);

  m = /^side\s+([\d.]+)\s+units$/.exec(body);
  if (m) return prompt.startsWith("Cube") ? num(m[1]!) ** 3 : num(m[1]!) ** 2;

  m = /^([\d.]+)\s*×\s*([\d.]+)(?:\s*×\s*([\d.]+))?\s+units$/.exec(body);
  if (m) return num(m[1]!) * num(m[2]!) * (m[3] ? num(m[3]) : 1);

  throw new Error(`no rule for prompt: ${prompt}`);
}

describe("the numbers match the words", () => {
  it.each(QUESTIONS.map((q): [string, Question] => [`${q.left} / ${q.right}`, q]))(
    "%s",
    (_label, q) => {
      expect(valueOf(q.left)).toBeCloseTo(q.a, 6);
      expect(valueOf(q.right)).toBeCloseTo(q.b, 6);
    }
  );

  it("explains the answer without leaning on which side it was printed", () => {
    // dailyQuestions swaps left and right, so an explanation saying "the left one" would be
    // wrong half the time. Stating both values instead survives the swap and also pins the
    // prose to the arithmetic above: change a number and the explanation has to follow.
    for (const q of QUESTIONS) {
      expect(q.explanation.toLowerCase(), q.left).not.toMatch(/\b(left|right)\b/);
      expect(q.explanation, `${q.left} -> ${q.a}`).toMatch(new RegExp(`\\b${q.a}\\b`));
      expect(q.explanation, `${q.right} -> ${q.b}`).toMatch(new RegExp(`\\b${q.b}\\b`));
    }
  });
});

describe("daily set", () => {
  it("asks every question once, however the day shuffles them", () => {
    for (const day of YEAR.slice(0, 30)) {
      const asked = dailyQuestions(day);
      expect(asked).toHaveLength(QUESTIONS.length);
      expect(new Set(asked.map((q) => q.explanation)).size).toBe(QUESTIONS.length);
    }
  });

  it("keeps a swapped question truthful", () => {
    for (const day of YEAR.slice(0, 60)) {
      for (const asked of dailyQuestions(day)) {
        // Whichever way round it was printed, the numbers still follow from the words.
        expect(valueOf(asked.left)).toBeCloseTo(asked.a, 6);
        expect(valueOf(asked.right)).toBeCloseTo(asked.b, 6);
        const winner = asked.a > asked.b ? "left" : "right";
        expect(isCorrect(asked, winner)).toBe(true);
        expect(isCorrect(asked, winner === "left" ? "right" : "left")).toBe(false);
      }
    }
  });

  it("does not park the answer on one side all day", () => {
    for (const day of YEAR) {
      const lefts = dailyQuestions(day).filter((q) => q.a > q.b).length;
      expect(lefts, day).toBeGreaterThan(0);
      expect(lefts, day).toBeLessThan(QUESTIONS.length);
    }
  });

  it("is stable for a day and different between days", () => {
    expect(dailyQuestions(YEAR[0]!)).toEqual(dailyQuestions(YEAR[0]!));
    const shapes = new Set(
      YEAR.map((day) =>
        dailyQuestions(day)
          .map((q) => `${q.left}|${q.a}`)
          .join("/")
      )
    );
    expect(shapes.size).toBeGreaterThan(300);
  });
});
