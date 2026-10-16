export type Ecosystem = { plants: number; herbivores: number; predators: number; round: number };
export const INITIAL_ECOSYSTEM: Ecosystem = { plants: 60, herbivores: 9, predators: 2, round: 0 };
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
/** Deliberately fictional turn model. All rates are gameplay assumptions, not biological estimates. */
export function ecosystemStep(s: Ecosystem): Ecosystem {
  if (!Object.values(s).every((v) => Number.isFinite(v) && v >= 0))
    throw new Error("Invalid ecosystem");
  const plants = clamp(s.plants + 12 * (1 - s.plants / 120) - s.herbivores * 0.55, 0, 120);
  const herbivores = clamp(s.herbivores + (s.plants >= 20 ? 1.4 : -2) - s.predators * 0.55, 0, 30);
  const predators = clamp(s.predators + (s.herbivores >= s.predators * 3 ? 0.15 : -0.65), 0, 12);
  return { plants, herbivores, predators, round: s.round + 1 };
}
export function isAlive(s: Ecosystem) {
  return s.plants >= 1 && s.herbivores >= 1 && s.predators >= 1;
}
export function ecosystemScore(s: Ecosystem) {
  return Math.min(100, (s.round / 12) * 100);
}
