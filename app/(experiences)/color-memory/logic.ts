/** Rounds in one color-memory run; the catalogue copy promises five. */
export const ROUNDS = 5;

import { seededRandom } from "@/lib/games/daily";
export type RGB = [number, number, number];
export const PALETTE: RGB[] = [
  [182, 71, 109],
  [42, 139, 174],
  [115, 168, 67],
  [205, 137, 43],
  [114, 81, 183],
];
/** Straight-line distance between two colours in RGB space. */
export function colorDistance(a: RGB, b: RGB): number {
  return Math.hypot(...a.map((v, i) => v - b[i]!));
}

export function colorScore(target: RGB, guess: RGB) {
  if (![...target, ...guess].every((n) => Number.isFinite(n) && n >= 0 && n <= 255))
    throw new Error("Invalid RGB channel");
  return Math.max(0, 100 * (1 - colorDistance(target, guess) / (255 * Math.sqrt(3))));
}
export function rgb(color: RGB) {
  return `rgb(${color.join(", ")})`;
}
export type ColorHistory = { scores: number[] };
export const EMPTY_HISTORY: ColorHistory = { scores: [] };
export function isColorHistory(value: unknown): value is ColorHistory {
  return (
    !!value &&
    typeof value === "object" &&
    "scores" in value &&
    Array.isArray(value.scores) &&
    value.scores.length <= 10 &&
    value.scores.every(
      (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100
    )
  );
}

/**
 * How far apart two colours in one day's set have to be.
 *
 * Drawing five colours independently let near-duplicates through: over a year of days the
 * closest pair sat 10.3 apart, which scores 97.7 against each other. On roughly one day in
 * eight, two of the five rounds asked the same question twice and the player could not tell
 * they were different colours at all. 60 is comfortably visible and still leaves the cube
 * (180 units a side) plenty of room for five picks.
 */
export const MIN_SEPARATION = 60;

export function dailyColors(day: string): RGB[] {
  const random = seededRandom(`color-memory:v1:${day}`);
  const draw = (): RGB => [
    50 + Math.floor(random() * 181),
    50 + Math.floor(random() * 181),
    50 + Math.floor(random() * 181),
  ];
  const colors: RGB[] = [];
  while (colors.length < ROUNDS) {
    let candidate = draw();
    // Bounded, so a cramped seed degrades to a close colour rather than hanging forever.
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (colors.every((chosen) => colorDistance(chosen, candidate) >= MIN_SEPARATION)) break;
      candidate = draw();
    }
    colors.push(candidate);
  }
  return colors;
}
