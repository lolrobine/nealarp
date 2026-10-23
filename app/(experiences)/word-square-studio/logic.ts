export type SquareLevel = {
  id: string;
  size: 3 | 4;
  /** Target rows; the columns are the same words read downward. */
  rows: string[];
  distractors: string[];
};

/** Each level is a true word square: reading the rows down equals reading the columns across.
 *
 * The distractors are deliberately tempting (mostly anagrams of a real answer), but they must
 * never complete a *second* valid square, or the game would reject a correct solution. Three
 * levels used to do exactly that - "arm" finished pea/ear/arm, "ten" finished oat/are/ten and
 * "rear" finished star/tare/area/rear. `only one square per bank` in logic.test.ts brute-forces
 * every ordering of every bank and fails if a new distractor reopens that hole. */
export const SQUARES: SquareLevel[] = [
  {
    id: "sap",
    size: 3,
    rows: ["sap", "ape", "pea"],
    distractors: ["oat", "tar"],
  },
  {
    id: "oat",
    size: 3,
    rows: ["oat", "are", "tea"],
    distractors: ["ant", "pea"],
  },
  {
    id: "ate",
    size: 3,
    rows: ["ate", "ten", "end"],
    distractors: ["ore", "sun"],
  },
  {
    id: "pea",
    size: 3,
    rows: ["pea", "ear", "art"],
    distractors: ["tar", "eat"],
  },
  {
    id: "ash",
    size: 3,
    rows: ["oat", "ash", "the"],
    distractors: ["has", "are"],
  },
  {
    id: "pan",
    size: 3,
    rows: ["ape", "pea", "ear"],
    distractors: ["pin", "tar"],
  },
  {
    id: "limb",
    size: 4,
    rows: ["limb", "idea", "meal", "ball"],
    distractors: ["tale", "reed"],
  },
  {
    id: "cart",
    size: 4,
    rows: ["cart", "area", "reel", "tale"],
    distractors: ["tars", "pier"],
  },
  {
    id: "star",
    size: 4,
    rows: ["star", "tare", "area", "read"],
    distractors: ["rate", "late"],
  },
  {
    id: "toga",
    size: 4,
    rows: ["arts", "riot", "toga", "star"],
    distractors: ["rose", "meet"],
  },
];

export function transposeRows(rows: string[]): string[] {
  return rows.map((_, i) => rows.map((r) => r[i] ?? "").join(""));
}

export function isTrueSquare(rows: string[]): boolean {
  const cols = transposeRows(rows);
  return rows.every((row, i) => row === cols[i]);
}

export function bankWords(level: SquareLevel): string[] {
  return [...level.rows, ...level.distractors];
}

export type RowFeedback = { rowOk: boolean[]; solved: boolean };

/** A row counts as correct when it matches the target square.
 *
 * There is no separate "mirror reading" to accept: a true word square *is* its own transpose,
 * so reading it down the columns returns the very same rows in the very same order. The older
 * mirror branch here could never fire, and the test that covered it could never fail. */
export function evaluateRows(level: SquareLevel, placed: (string | null)[]): RowFeedback {
  const target = level.rows;
  const norm = (s: string | null) => (s ?? "").trim().toLowerCase();
  const rowOk = placed.map((word, i) => norm(word) === target[i]);
  return { rowOk, solved: rowOk.every(Boolean) && placed.length === level.size };
}

export function scoreSquare(wrongChecks: number, hints: number): number {
  return Math.max(0, Math.min(100, 100 - 6 * wrongChecks - 3 * hints));
}
