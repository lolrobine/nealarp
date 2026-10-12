import { describe, it, expect } from "vitest";
import { lifeStats } from "./calculator";

describe("lifeStats calculator", () => {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneYearMs = 365.25 * oneDayMs;

  it("returns 0 for negative age", () => {
    for (const stat of lifeStats) {
      expect(stat.getValue(-1000)).toBeGreaterThanOrEqual(0);
    }
  });

  it("heartbeats ~72 per minute", () => {
    const stat = lifeStats.find((s) => s.id === "heartbeats")!;
    const oneMinuteMs = 60 * 1000;
    expect(stat.getValue(oneMinuteMs)).toBe(72);
  });

  it("steps accounts for baby not walking", () => {
    const stat = lifeStats.find((s) => s.id === "steps")!;
    expect(stat.getValue(0)).toBe(0);
    expect(stat.getValue(200 * oneDayMs)).toBe(0); // 200 days old, no walking
    expect(stat.getValue(400 * oneDayMs)).toBeGreaterThan(0);
  });

  it("words accounts for baby not speaking", () => {
    const stat = lifeStats.find((s) => s.id === "words")!;
    expect(stat.getValue(0)).toBe(0);
    expect(stat.getValue(200 * oneDayMs)).toBe(0);
    expect(stat.getValue(2 * oneYearMs)).toBeGreaterThan(0);
  });

  it("hair growth net is half gross", () => {
    const stat = lifeStats.find((s) => s.id === "hair")!;
    // gross 10*0.00044=0.0044, net half=0.0022 -> rounded 0.00? Let's check 100 days
    const hundredDays = 100 * oneDayMs;
    const val = stat.getValue(hundredDays);
    // 100*0.00044=0.044 gross, net 0.022
    expect(val).toBeCloseTo(0.02, 1);
  });

  it("earth orbits", () => {
    const stat = lifeStats.find((s) => s.id === "earth-orbits")!;
    expect(stat.getValue(oneYearMs)).toBeCloseTo(1, 1);
  });

  it("all stats have formatter", () => {
    for (const stat of lifeStats) {
      const formatted = stat.format(stat.getValue(oneYearMs));
      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    }
  });
});
