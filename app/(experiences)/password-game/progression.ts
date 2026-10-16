/** Reveal the first failing rule, retaining everything the player already unlocked. */
export function unlockedRuleCount(results: readonly boolean[], previous = 1) {
  const firstFailure = results.findIndex((passed) => !passed);
  return Math.min(
    results.length,
    Math.max(previous, firstFailure < 0 ? results.length : firstFailure + 1)
  );
}
