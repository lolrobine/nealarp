import { describe, it, expect } from "vitest";
import { getExperiences, getLiveExperiences, ExperienceSchema } from "./experiences";

describe("experiences registry", () => {
  it("validates all experiences", () => {
    const exps = getExperiences();
    expect(exps.length).toBeGreaterThan(0);
    exps.forEach((exp) => {
      const res = ExperienceSchema.safeParse(exp);
      expect(res.success).toBe(true);
    });
  });

  it("getLiveExperiences only live", () => {
    const live = getLiveExperiences();
    expect(live.every((e) => e.status === "live")).toBe(true);
  });
});
