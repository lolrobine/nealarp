import { describe, it, expect } from "vitest";
import { getExperiences } from "@/lib/registry/experiences";
import { TASKS } from "@/app/(experiences)/trust-your-eyes/logic";
import { ROUNDS } from "@/app/(experiences)/color-memory/logic";
import { PROMPTS } from "@/app/(experiences)/form-game/logic";
import { LEVELS } from "@/app/(experiences)/pack-it-perfectly/logic";
import { GOLF_LEVELS } from "@/app/(experiences)/gravity-golf/logic";
import { DIG_SITES } from "@/app/(experiences)/how-deep-can-you-dig/data";
import { TARGET_ROUNDS } from "@/app/(experiences)/tiny-ecosystem/logic";
import { CLUES } from "@/app/(experiences)/clue-school/data";
import { ITEMS } from "@/app/(experiences)/growbox/logic";
import { WIN_HEIGHT } from "@/app/(experiences)/stack-ledger/logic";
import { MAPS } from "@/app/(experiences)/current-courier/logic";
import { PLACEMENTS } from "@/app/(experiences)/tiny-town-tactics/logic";
import { DRAFT_SIZE } from "@/app/(experiences)/lane-general/logic";
import { DAYS } from "@/app/(experiences)/stockroom-six/logic";
import { GOALS } from "@/app/(experiences)/pocket-sand/logic";
import { GENERATIONS } from "@/app/(experiences)/copy-machine/logic";
import { TOTAL_MONEY } from "@/app/(experiences)/spend-money/data";

/**
 * The catalogue sells each game with a sentence, and several of those sentences
 * promise a number: eight discoveries, twelve turns, nine courses. A player
 * reads that before they click, so it is a promise the build has to keep.
 *
 * Gravity Golf advertised "three solo courses" while shipping nine. Nothing
 * caught it, because the sentence lives in JSON and the courses live in
 * TypeScript. This file is the join between the two.
 *
 * Every number word in every description must be listed below, either as a
 * COUNTED claim checked against the real data, or as PROSE where the number is
 * part of the phrasing rather than a count of content ("change one parameter").
 * An unlisted number fails the last test, so a new numeric promise cannot be
 * made without either proving it or classifying it.
 */

/** Number words the descriptions actually use, mapped to their value. */
const WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  sixteen: 16,
  twenty: 20,
};

/** id -> the number words the description is allowed to contain as prose. */
const PROSE: Record<string, string[]> = {
  "one-second-off": ["one"],
  "one-small-change": ["one"],
  "twin-tilt": ["one", "two"],
  "current-courier": ["one", "five", "100"],
  "gate-crash": ["one"],
  "pass-the-pencil": ["one"],
  "block-talk": ["one"],
  "copy-machine": ["one"],
  growbox: ["one"],
};

/** id -> [number word in the description, what the build actually provides]. */
const COUNTED: Record<string, [string, number]> = {
  "trust-your-eyes": ["six", TASKS.length],
  "color-memory": ["five", ROUNDS],
  "form-game": ["ten", PROMPTS.length],
  "pack-it-perfectly": ["three", LEVELS.length],
  "gravity-golf": ["nine", GOLF_LEVELS.length],
  "how-deep-can-you-dig": ["eight", DIG_SITES.length],
  "tiny-ecosystem": ["twelve", TARGET_ROUNDS],
  "clue-school": ["eight", CLUES.length],
  growbox: ["eight", ITEMS.length],
  "stack-ledger": ["20", WIN_HEIGHT],
  "current-courier": ["seven", MAPS.length],
  "tiny-town-tactics": ["sixteen", PLACEMENTS],
  "lane-general": ["three", DRAFT_SIZE],
  "stockroom-six": ["12", DAYS],
  "pocket-sand": ["six", GOALS.length],
  "copy-machine": ["five", GENERATIONS],
};

const experiences = getExperiences();

function description(id: string): string {
  const entry = experiences.find((e) => e.id === id);
  if (!entry) throw new Error(`no catalogue entry for ${id}`);
  return entry.description;
}

/** Every number word and bare integer in a sentence, lowercased. */
function numbersIn(text: string): string[] {
  const pattern = new RegExp(`\\b(${Object.keys(WORDS).join("|")}|\\d+)\\b`, "gi");
  return (text.match(pattern) ?? []).map((m) => m.toLowerCase());
}

describe("catalogue claims match the games", () => {
  for (const [id, [word, actual]] of Object.entries(COUNTED)) {
    it(`${id} promises ${word} and ships ${actual}`, () => {
      const text = description(id);
      expect(text.toLowerCase()).toContain(word);
      expect(WORDS[word] ?? Number(word)).toBe(actual);
    });
  }

  it("spend money hands the player the trillion it advertises", () => {
    expect(description("spend-money")).toContain("trillion");
    expect(TOTAL_MONEY).toBe(1_000_000_000_000);
  });

  it("every number in every description is either counted or declared prose", () => {
    const unclassified: string[] = [];
    for (const entry of experiences) {
      const allowed = new Set<string>(PROSE[entry.id] ?? []);
      const counted = COUNTED[entry.id];
      if (counted) allowed.add(counted[0]);
      for (const n of numbersIn(entry.description)) {
        if (!allowed.has(n)) unclassified.push(`${entry.id}: "${n}"`);
      }
    }
    expect(unclassified).toEqual([]);
  });
});
