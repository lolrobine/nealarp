export type SquareLevel = {
  id: string;
  size: 3 | 4;
  /** Target rows; the columns are the same words read downward. */
  rows: string[];
  distractors: string[];
};

/** Each level is a true word square: reading the rows down equals reading the columns across.
 * Squares were found by exhaustive search over a common-word list and rechecked here. */
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
    distractors: ["arm", "eat"],
  },
  {
    id: "ash",
    size: 3,
    rows: ["oat", "ash", "the"],
    distractors: ["ten", "are"],
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
    distractors: ["rear", "late"],
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

export type RowFeedback = { rowOk: boolean[]; solved: boolean; solvedViaTranspose: boolean };

/** A row counts as correct when it matches the target square (or its mirror reading). */
export function evaluateRows(level: SquareLevel, placed: (string | null)[]): RowFeedback {
  const target = level.rows;
  const mirror = transposeRows(level.rows);
  const norm = (s: string | null) => (s ?? "").trim().toLowerCase();
  const rowOk = placed.map((word, i) => norm(word) === target[i]);
  const viaTarget = rowOk.every(Boolean) && placed.length === level.size;
  const viaMirror =
    placed.every((word, i) => norm(word) === mirror[i]) && placed.length === level.size;
  return { rowOk, solved: viaTarget || viaMirror, solvedViaTranspose: viaMirror && !viaTarget };
}

export function scoreSquare(wrongChecks: number, hints: number): number {
  return Math.max(0, Math.min(100, 100 - 6 * wrongChecks - 3 * hints));
}
