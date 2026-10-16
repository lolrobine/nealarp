export const MILESTONES = [
  { name: "First finish", threshold: 0 },
  { name: "Bronze", threshold: 60 },
  { name: "Silver", threshold: 80 },
  { name: "Gold", threshold: 95 },
  { name: "Perfect", threshold: 100 },
] as const;
export function localAchievements(score: number | null) {
  return MILESTONES.map((item) => ({
    ...item,
    unlocked: score !== null && Number.isFinite(score) && score >= item.threshold && score <= 100,
  }));
}
