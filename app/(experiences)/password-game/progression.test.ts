import { expect, it } from "vitest";
import { unlockedRuleCount } from "./progression";
it("reveals through the first failure without cascading effects", () => {
  expect(unlockedRuleCount([false, false, false])).toBe(1);
  expect(unlockedRuleCount([true, true, false, false])).toBe(3);
  expect(unlockedRuleCount([true, true, true])).toBe(3);
});
it("retains unlocked rules when a password edit invalidates earlier rules", () => {
  expect(unlockedRuleCount([false, false, false, false], 4)).toBe(4);
});
