import { seededRandom } from "@/lib/games/daily";
export type RGB = [number, number, number];
export const PALETTE: RGB[] = [
  [182, 71, 109],
  [42, 139, 174],
  [115, 168, 67],
  [205, 137, 43],
  [114, 81, 183],
];
export function colorScore(target: RGB, guess: RGB) {
  if (![...target, ...guess].every((n) => Number.isFinite(n) && n >= 0 && n <= 255))
    throw new Error("Invalid RGB channel");
  const distance = Math.hypot(...target.map((v, i) => v - guess[i]!));
  return Math.max(0, 100 * (1 - distance / (255 * Math.sqrt(3))));
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

export function dailyColors(day: string): RGB[] {
  const random = seededRandom(`color-memory:v1:${day}`);
  return Array.from({ length: 5 }, () => [
    50 + Math.floor(random() * 181),
    50 + Math.floor(random() * 181),
    50 + Math.floor(random() * 181),
  ]);
}
