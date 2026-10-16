export type Task = { kind: "line" | "center" | "angle"; target: number };
export const TASKS: Task[] = [
  { kind: "line", target: 50 },
  { kind: "center", target: 50 },
  { kind: "angle", target: 35 },
  { kind: "line", target: 50 },
  { kind: "center", target: 50 },
  { kind: "angle", target: 125 },
];
export function visualResult(task: Task, x: number, y = 50) {
  if (![x, y, task.target].every(Number.isFinite)) throw new Error("Invalid estimate");
  const error =
    task.kind === "angle"
      ? Math.abs(x - task.target) / 180
      : task.kind === "line"
        ? Math.abs(x - 50) / 100
        : Math.hypot(x - 50, y - 50) / (Math.SQRT2 * 100);
  return { errorPercent: error * 100, score: Math.max(0, 100 * (1 - 2 * error)) };
}
