import { localDayKey, seededRandom } from "@/lib/games/daily";

export type ConstraintId =
  "ordered-letters" | "word-length" | "long-words" | "no-repeat" | "word-count" | "bookends";

export type ConstraintCard = {
  id: ConstraintId;
  label: string;
  hint: string;
  check: (words: string[], letters: string) => boolean;
};

export const CONSTRAINTS: ConstraintCard[] = [
  {
    id: "ordered-letters",
    label: "Letters in order",
    hint: "Some words start with the target letters, in order from first to last.",
    check: (words, letters) => coverage(words, letters) >= letters.length,
  },
  {
    id: "word-length",
    label: "Every word 4+ letters",
    hint: "No short filler words.",
    check: (words) => words.length > 0 && words.every((w) => w.length >= 4),
  },
  {
    id: "long-words",
    label: "Two 6+ letter words",
    hint: "Show off at least two longer words.",
    check: (words) => words.filter((w) => w.length >= 6).length >= 2,
  },
  {
    id: "no-repeat",
    label: "No word repeated",
    hint: "Every word is different.",
    check: (words) => new Set(words).size === words.length && words.length > 0,
  },
  {
    id: "word-count",
    label: "Between 4 and 8 words",
    hint: "Keep the phrase tight.",
    check: (words) => words.length >= 4 && words.length <= 8,
  },
  {
    id: "bookends",
    label: "Open and close correctly",
    hint: "The first word starts with the first letter and the last word starts with the last letter.",
    check: (words, letters) =>
      words.length >= 2 &&
      words[0]![0] === letters[0] &&
      words[words.length - 1]![0] === letters[letters.length - 1],
  },
];

/** Ten daily letter pools; day index picks one so everyone plays the same letters. */
export const LETTER_POOLS = [
  "spark",
  "charm",
  "gleam",
  "tulip",
  "frost",
  "blaze",
  "quill",
  "mocha",
  "vivid",
  "jumbo",
];

export function dailyLetters(date = new Date()): string {
  const random = seededRandom(`backronym-studio:${localDayKey(date)}`);
  return LETTER_POOLS[Math.floor(random() * LETTER_POOLS.length)] ?? "spark";
}

export function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
}

/** How many target letters are matched by word-initials, in order (subsequence). */
export function coverage(words: string[], letters: string): number {
  let i = 0;
  for (const word of words) {
    if (i < letters.length && word[0] === letters[i]) i++;
  }
  return i;
}

/** Which word claims each target letter, using the same greedy left-to-right
 *  walk as coverage(). The board shows this so the rule is visible rather than
 *  summarised as a count. */
export function coverageTrail(words: string[], letters: string): (string | null)[] {
  const trail: (string | null)[] = letters.split("").map(() => null);
  let i = 0;
  for (const word of words) {
    if (i < letters.length && word[0] === letters[i]) {
      trail[i] = word;
      i += 1;
    }
  }
  return trail;
}

export type BackronymScore = {
  total: number;
  coveragePoints: number;
  constraintPoints: number;
  qualityPoints: number;
  coverage: number;
  constraintsMet: ConstraintId[];
};

/** Visible rubric: coverage 40 + constraints 30 (5 each) + quality 30. */
export function scoreBackronym(
  letters: string,
  text: string,
  activeConstraints: ConstraintId[] = CONSTRAINTS.map((c) => c.id)
): BackronymScore {
  const words = splitWords(text);
  const covered = coverage(words, letters.toLowerCase());
  const coveragePoints = Math.round((covered / letters.length) * 40);

  const met: ConstraintId[] = [];
  for (const card of CONSTRAINTS) {
    if (activeConstraints.includes(card.id) && card.check(words, letters.toLowerCase()))
      met.push(card.id);
  }
  const activeCount = activeConstraints.length || 1;
  const constraintPoints = Math.round((met.length / activeCount) * 30);

  const avgLength = words.length ? words.reduce((s, w) => s + w.length, 0) / words.length : 0;
  const lengthQuality = Math.min(1, avgLength / 5.5);
  const countQuality =
    words.length === 0 ? 0 : words.length <= 8 ? 1 : Math.max(0, 1 - (words.length - 8) * 0.15);
  const qualityPoints = Math.round(15 * lengthQuality + 15 * countQuality);

  return {
    total: Math.min(100, coveragePoints + constraintPoints + qualityPoints),
    coveragePoints,
    constraintPoints,
    qualityPoints,
    coverage: covered,
    constraintsMet: met,
  };
}
