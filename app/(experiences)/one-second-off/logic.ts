export function timingResult(elapsedMs: number, targetSeconds: number) {
  if (
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0 ||
    !Number.isFinite(targetSeconds) ||
    targetSeconds <= 0
  ) {
    throw new Error("Invalid timing input");
  }
  const errorMs = Math.abs(elapsedMs - targetSeconds * 1000);
  return { errorMs, score: Math.max(0, 100 * (1 - errorMs / (targetSeconds * 1000))) };
}
export function average(scores: number[]) {
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
}
