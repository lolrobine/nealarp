import { describe, it, expect } from "vitest";
import { speedItems, formatSpeed, convertSpeed } from "./data";

describe("speed data", () => {
  it("all speeds are positive", () => {
    for (const item of speedItems) {
      expect(item.speed).toBeGreaterThan(0);
    }
  });

  it("light speed is fastest", () => {
    const max = Math.max(...speedItems.map((i) => i.speed));
    const light = speedItems.find((i) => i.name.includes("Light (vacuum)"))!;
    expect(light.speed).toBe(max);
  });

  it("fiber optic speed is realistic (not 299792 km/h)", () => {
    const fiber = speedItems.find((i) => i.name.includes("fiber"))!;
    // Should be ~720M km/h, not 299k
    expect(fiber.speed).toBeGreaterThan(1_000_000);
  });

  it("formatSpeed works", () => {
    expect(formatSpeed(5, "kmh")).toContain("km/h");
    expect(formatSpeed(5, "mph")).toContain("mph");
    expect(formatSpeed(5, "ms")).toContain("m/s");
    expect(formatSpeed(1_000_000, "kmh")).toContain("M");
  });

  it("convertSpeed", () => {
    expect(convertSpeed(100, "kmh")).toBe(100);
    expect(convertSpeed(100, "mph")).toBeCloseTo(62.1, 0);
    expect(convertSpeed(100, "ms")).toBeCloseTo(27.77, 1);
  });

  it("has categories", () => {
    const cats = new Set(speedItems.map((i) => i.category));
    expect(cats.has("animals")).toBe(true);
    expect(cats.has("vehicles")).toBe(true);
  });
});
