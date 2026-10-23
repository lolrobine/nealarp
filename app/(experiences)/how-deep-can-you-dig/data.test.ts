import { describe, expect, it } from "vitest";
import { DIG_SITES, INITIAL_DIG, isDigProgress } from "./data";

describe("the dig sites", () => {
  it("runs from the surface to the centre of the model Earth", () => {
    expect(DIG_SITES[0]!.depth).toBe(0);
    expect(DIG_SITES.at(-1)!.depth).toBe(6371);
  });

  it("gets strictly deeper, so the journey never doubles back", () => {
    for (let i = 1; i < DIG_SITES.length; i++) {
      expect(DIG_SITES[i]!.depth).toBeGreaterThan(DIG_SITES[i - 1]!.depth);
    }
  });

  it("gives every stop a name and an explanation", () => {
    for (const site of DIG_SITES) {
      expect(site.name.trim().length).toBeGreaterThan(0);
      expect(site.text.trim().length).toBeGreaterThan(20);
    }
  });

  /**
   * The depths here are round numbers from a simplified Earth model, not
   * measurements. Every stop says so in its own words; this fails if one is
   * ever rewritten into a confident claim.
   */
  it("admits in the text of each stop that the model is simplified", () => {
    const hedges = /model|illustrative|approximate|imaginary|fictional|rounded|varies|not a/i;
    for (const site of DIG_SITES) {
      expect(hedges.test(site.text), `"${site.name}" states its depth as fact`).toBe(true);
    }
  });

  it("uses the mean Earth radius it claims to use", () => {
    expect(DIG_SITES.at(-1)!.text).toContain("6,371");
  });
});

describe("saved dig progress", () => {
  it("starts at the surface with nothing unlocked", () => {
    expect(INITIAL_DIG).toEqual({ unlocked: 0, selected: 0 });
    expect(isDigProgress(INITIAL_DIG)).toBe(true);
  });

  it("accepts a selection at or behind the deepest stop reached", () => {
    expect(isDigProgress({ unlocked: 4, selected: 4 })).toBe(true);
    expect(isDigProgress({ unlocked: 4, selected: 0 })).toBe(true);
  });

  it("refuses a selection deeper than the player has actually dug", () => {
    expect(isDigProgress({ unlocked: 2, selected: 3 })).toBe(false);
  });

  it("refuses an unlock past the end of the list", () => {
    expect(isDigProgress({ unlocked: DIG_SITES.length, selected: 0 })).toBe(false);
  });

  it("refuses negative, fractional and non-numeric values", () => {
    expect(isDigProgress({ unlocked: -1, selected: 0 })).toBe(false);
    expect(isDigProgress({ unlocked: 1.5, selected: 0 })).toBe(false);
    expect(isDigProgress({ unlocked: 2, selected: -1 })).toBe(false);
    expect(isDigProgress({ unlocked: "2", selected: 0 })).toBe(false);
  });

  it("refuses anything that is not a progress object at all", () => {
    expect(isDigProgress(null)).toBe(false);
    expect(isDigProgress(undefined)).toBe(false);
    expect(isDigProgress({})).toBe(false);
    expect(isDigProgress({ unlocked: 1 })).toBe(false);
    expect(isDigProgress([])).toBe(false);
  });
});
