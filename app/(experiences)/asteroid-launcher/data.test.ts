import { describe, it, expect } from "vitest";
import { calculateImpact } from "./data";

describe("asteroid impact calculator", () => {
  it("calculates energy for 1m rock", () => {
    const result = calculateImpact({ diameter: 1, density: 3000, velocity: 20, angle: 45 });
    expect(result.energy).toBeGreaterThan(1e11);
    expect(result.energy).toBeLessThan(1e12);
    expect(result.mass).toBeGreaterThan(0);
  });

  it("crater scales with diameter", () => {
    const small = calculateImpact({ diameter: 1, density: 3000, velocity: 20, angle: 90 });
    const large = calculateImpact({ diameter: 100, density: 3000, velocity: 20, angle: 90 });
    expect(large.craterDiameter).toBeGreaterThan(small.craterDiameter);
    // 100x diameter should give ~100x crater (empirical scaling)
    expect(large.craterDiameter / small.craterDiameter).toBeCloseTo(100, 0);
  });

  it("angle affects crater", () => {
    const vertical = calculateImpact({ diameter: 100, density: 3000, velocity: 20, angle: 90 });
    const shallow = calculateImpact({ diameter: 100, density: 3000, velocity: 20, angle: 15 });
    expect(vertical.craterDiameter).toBeGreaterThan(shallow.craterDiameter);
  });

  it("realistic values for known impacts", () => {
    const chelyabinsk = calculateImpact({ diameter: 20, density: 3300, velocity: 19, angle: 18 });
    // Chelyabinsk airburst ~440kt, crater if ground hit ~150m
    expect(chelyabinsk.craterDiameter).toBeGreaterThan(0.1); // >100m
    expect(chelyabinsk.craterDiameter).toBeLessThan(1); // <1km
    expect(chelyabinsk.earthquakeMagnitude).toBeGreaterThan(3);
    expect(chelyabinsk.earthquakeMagnitude).toBeLessThan(6);

    const dino = calculateImpact({ diameter: 10000, density: 2700, velocity: 20, angle: 45 });
    // Chicxulub ~150km crater
    expect(dino.craterDiameter).toBeGreaterThan(50);
    expect(dino.craterDiameter).toBeLessThan(200);
    expect(dino.earthquakeMagnitude).toBeGreaterThan(9);
  });

  it("TNT equivalent formatting", () => {
    const small = calculateImpact({ diameter: 1, density: 3000, velocity: 20, angle: 45 });
    expect(small.equivalentTNT).toMatch(/tons|kilotons|megatons|gigatons/);

    const large = calculateImpact({ diameter: 10000, density: 3000, velocity: 20, angle: 90 });
    expect(large.equivalentTNT).toContain("gigatons");
  });

  it("never returns negative or Infinity", () => {
    const result = calculateImpact({ diameter: 15000, density: 8000, velocity: 72, angle: 90 });
    expect(Number.isFinite(result.craterDiameter)).toBe(true);
    expect(result.craterDiameter).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.fireballRadius)).toBe(true);
    expect(Number.isFinite(result.thermalRadiationDistance)).toBe(true);
    expect(Number.isFinite(result.blastWaveDistance)).toBe(true);
    expect(Number.isFinite(result.earthquakeMagnitude)).toBe(true);
    expect(Number.isFinite(result.affectedAreaKm2)).toBe(true);
    expect(typeof result.casualtyEstimate).toBe("string");
  });
});
