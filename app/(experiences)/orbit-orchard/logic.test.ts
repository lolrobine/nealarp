import { describe, expect, it } from "vitest";
import { collectedRings, DT, launch, LEVELS, scoreRun, simulate, stepBody } from "./logic";

describe("orbit-orchard integrator", () => {
  it("uses fixed 1/120 s steps", () => {
    expect(DT).toBeCloseTo(1 / 120, 10);
  });

  it("is deterministic for identical inputs", () => {
    const body = launch(Math.PI / 3, 70, { x: 0, y: -220, vx: 0, vy: 0 });
    const a = simulate(body, 240);
    const b = simulate(body, 240);
    expect(a[a.length - 1]).toEqual(b[b.length - 1]);
  });

  it("keeps a circular-ish launch close to its starting distance", () => {
    // Circular orbit speed for radius 220: sqrt(MU / r) ≈ 7.39√... — launch sideways.
    const speed = Math.sqrt(12000 / 220);
    const body = { x: 0, y: -220, vx: speed, vy: 0 };
    const path = simulate(body, 600);
    const radii = path.map((p) => Math.hypot(p.x, p.y));
    const avg = radii.reduce((s, r) => s + r, 0) / radii.length;
    expect(avg).toBeGreaterThan(150);
    expect(avg).toBeLessThan(300);
  });

  it("gravity bends the path toward the star", () => {
    const body = { x: -300, y: -300, vx: 60, vy: 0 };
    const before = Math.hypot(body.x, body.y);
    const after = stepBody(stepBody(stepBody(body)));
    expect(Math.hypot(after.x, after.y)).toBeLessThan(before);
  });
});

describe("orbit-orchard rings and scoring", () => {
  it("collects rings the trajectory passes through", () => {
    const path = [
      { x: 0, y: 0, vx: 0, vy: 0 },
      { x: 50, y: 0, vx: 0, vy: 0 },
    ];
    const rings = [
      { id: 0, x: 0, y: 0, r: 10 },
      { id: 1, x: 50, y: 0, r: 10 },
      { id: 2, x: 500, y: 500, r: 10 },
    ];
    expect(collectedRings(path, rings)).toEqual([0, 1]);
  });

  it("levels carry rings and launch pads", () => {
    expect(LEVELS.length).toBe(3);
    for (const level of LEVELS) {
      expect(level.rings.length).toBeGreaterThanOrEqual(3);
      expect(level.launchPower).toBeGreaterThan(0);
    }
  });

  it("scoring maps collected fruit onto 0–100", () => {
    expect(scoreRun(0, 5)).toBe(0);
    expect(scoreRun(5, 5)).toBe(100);
    expect(scoreRun(2, 4)).toBe(50);
    expect(scoreRun(10, 4)).toBe(100);
  });
});
