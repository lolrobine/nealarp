export type Task = { kind: "line" | "center" | "angle"; target: number };
export const TASKS: Task[] = [
  { kind: "line", target: 50 },
  { kind: "center", target: 50 },
  { kind: "angle", target: 35 },
  { kind: "line", target: 50 },
  { kind: "center", target: 50 },
  { kind: "angle", target: 125 },
];
/**
 * Grades an estimate against the task's own target.
 *
 * The line and centre branches used to measure against a hard-coded 50 while
 * the task carried a target field, so the data and the grader only agreed by
 * luck: every line and centre task happens to sit at 50. A task written at any
 * other target would have been graded against the middle regardless, with no
 * test to notice.
 */
export function visualResult(task: Task, x: number, y = 50) {
  if (![x, y, task.target].every(Number.isFinite)) throw new Error("Invalid estimate");
  const error =
    task.kind === "angle"
      ? Math.abs(x - task.target) / 180
      : task.kind === "line"
        ? Math.abs(x - task.target) / 100
        : Math.hypot(x - task.target, y - task.target) / (Math.SQRT2 * 100);
  return { errorPercent: error * 100, score: Math.max(0, 100 * (1 - 2 * error)) };
}
