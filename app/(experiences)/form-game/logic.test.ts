import { describe, expect, it } from "vitest";
import { EMPTY_FORM, isFormProgress, PROMPTS, validateAnswer } from "./logic";

/** A run that satisfies every step, used as the base for the negative cases. */
const GOOD = [
  "Ada",
  "mint",
  "20+5",
  "Please let me apply for this permit",
  "permit",
  "4",
  "A-42",
  "this form is not a sandwich",
  "TIMREP",
  "I authorize this authorization",
];

describe("the form's prompts", () => {
  it("has a prompt and a hint for every step the validator knows", () => {
    expect(PROMPTS).toHaveLength(10);
    for (const [prompt, hint] of PROMPTS) {
      expect(prompt.length).toBeGreaterThan(0);
      expect(hint.length).toBeGreaterThan(0);
    }
  });

  it("rejects a step number it has no prompt for", () => {
    expect(validateAnswer(10, "anything", GOOD)).toBe(false);
    expect(validateAnswer(-1, "anything", GOOD)).toBe(false);
  });
});

describe("validateAnswer accepts a clean run", () => {
  it.each(GOOD.map((answer, step) => [step, answer] as const))(
    "step %i accepts %s",
    (step, answer) => {
      expect(validateAnswer(step, answer, GOOD)).toBe(true);
    }
  );

  it("ignores surrounding whitespace", () => {
    expect(validateAnswer(0, "  Ada  ", GOOD)).toBe(true);
  });
});

describe("each rule actually bites", () => {
  it("step 0 wants 2-20 letters and nothing else", () => {
    expect(validateAnswer(0, "A", GOOD)).toBe(false);
    expect(validateAnswer(0, "Ada Lovelace", GOOD)).toBe(false);
    expect(validateAnswer(0, "Ada3", GOOD)).toBe(false);
  });

  it("step 1 refuses a username that reuses a letter of the name", () => {
    expect(validateAnswer(1, "dam", GOOD)).toBe(false);
    expect(validateAnswer(1, "MINT", GOOD)).toBe(true);
    expect(validateAnswer(1, "no", GOOD)).toBe(false);
  });

  it("step 2 wants two positive numbers summing into a plausible age", () => {
    expect(validateAnswer(2, "20 + 5", GOOD)).toBe(true);
    expect(validateAnswer(2, "0+30", GOOD)).toBe(false);
    expect(validateAnswer(2, "5+5", GOOD)).toBe(false);
    expect(validateAnswer(2, "100+50", GOOD)).toBe(false);
    expect(validateAnswer(2, "25", GOOD)).toBe(false);
  });

  it("step 3 counts exactly seven words", () => {
    expect(validateAnswer(3, "One two three four five six", GOOD)).toBe(false);
    expect(validateAnswer(3, "One two three four five six seven eight", GOOD)).toBe(false);
  });

  it("step 4 follows whatever the player wrote in step 3", () => {
    const custom = [...GOOD];
    custom[3] = "I would like a permit today";
    expect(validateAnswer(4, "today", custom)).toBe(true);
    expect(validateAnswer(4, "permit", custom)).toBe(false);
  });

  it("step 5 counts the letters of the username the player chose", () => {
    const custom = [...GOOD];
    custom[1] = "orbit";
    expect(validateAnswer(5, "5", custom)).toBe(true);
    expect(validateAnswer(5, "4", custom)).toBe(false);
  });

  it("step 6 builds the reference from the player's own initial", () => {
    const custom = [...GOOD];
    custom[0] = "Bo";
    expect(validateAnswer(6, "B-42", custom)).toBe(true);
    expect(validateAnswer(6, "A-42", custom)).toBe(false);
  });
});

describe("the late steps do not hinge on capital letters", () => {
  it("accepts the sandwich line however it is typed", () => {
    expect(validateAnswer(7, "This Form Is Not A Sandwich", GOOD)).toBe(true);
  });

  it("accepts the reversed word in lower case, since the prompt never asks for capitals", () => {
    expect(validateAnswer(8, "timrep", GOOD)).toBe(true);
    expect(validateAnswer(8, "TimRep", GOOD)).toBe(true);
    expect(validateAnswer(8, "PERMIT", GOOD)).toBe(false);
  });

  it("accepts the authorization line however it is typed", () => {
    expect(validateAnswer(9, "i authorize this authorization", GOOD)).toBe(true);
    expect(validateAnswer(9, "I authorize this authorisation", GOOD)).toBe(false);
  });
});

describe("saved progress", () => {
  it("starts empty and accepts an empty run", () => {
    expect(EMPTY_FORM.answers).toEqual([]);
    expect(isFormProgress(EMPTY_FORM)).toBe(true);
  });

  it("accepts a consistent partial run", () => {
    expect(isFormProgress({ answers: GOOD.slice(0, 4) })).toBe(true);
  });

  it("rejects anything that is not a run of valid answers", () => {
    expect(isFormProgress(null)).toBe(false);
    expect(isFormProgress({})).toBe(false);
    expect(isFormProgress({ answers: "Ada" })).toBe(false);
    expect(isFormProgress({ answers: [42] })).toBe(false);
    expect(isFormProgress({ answers: ["Ada", "dam"] })).toBe(false);
    expect(isFormProgress({ answers: Array(11).fill("Ada") })).toBe(false);
  });

  it("rejects an answer long enough to be an attack rather than a name", () => {
    expect(isFormProgress({ answers: ["a".repeat(201)] })).toBe(false);
  });
});
