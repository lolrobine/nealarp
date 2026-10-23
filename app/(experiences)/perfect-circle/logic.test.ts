import { describe, expect, it } from "vitest";
import {
  calculateCircleScore,
  isCircleGhost,
  isCircleHistory,
  isCircleScore,
  kasaCircleFit,
  type Point,
} from "./logic";

/** A stroke sampled evenly around a circle. `sweep` of 1 is the full turn. */
function arc({ cx = 200, cy = 200, r = 100, sweep = 1, points = 120, wobble = 0 } = {}): Point[] {
  return Array.from({ length: points }, (_, i) => {
    const angle = (i / (points - 1)) * sweep * Math.PI * 2;
    const radius = r + (wobble ? Math.sin(i * 1.7) * wobble : 0);
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

describe("kasaCircleFit", () => {
  it("recovers the centre and radius of a clean circle", () => {
    const fit = kasaCircleFit(arc({ cx: 150, cy: 275, r: 80 }))!;
    expect(fit).not.toBeNull();
    expect(fit.centerX).toBeCloseTo(150, 1);
    expect(fit.centerY).toBeCloseTo(275, 1);
    expect(fit.radius).toBeCloseTo(80, 1);
  });

  it("refuses a stroke too short to fit anything to", () => {
    expect(kasaCircleFit([])).toBeNull();
    expect(kasaCircleFit(arc({ points: 4 }))).toBeNull();
  });

  it("survives a straight line without returning a nonsense object", () => {
    const line = Array.from({ length: 40 }, (_, i) => ({ x: i * 5, y: 100 }));
    const fit = kasaCircleFit(line);
    if (fit) {
      expect(Number.isFinite(fit.centerX)).toBe(true);
      expect(Number.isFinite(fit.centerY)).toBe(true);
      expect(Number.isFinite(fit.radius)).toBe(true);
    }
  });

  it("survives every point landing on the same spot", () => {
    const stack = Array.from({ length: 30 }, () => ({ x: 10, y: 10 }));
    const fit = kasaCircleFit(stack);
    if (fit) expect(Number.isFinite(fit.radius)).toBe(true);
  });
});

describe("calculateCircleScore", () => {
  it("gives a near-perfect circle a near-perfect mark", () => {
    const result = calculateCircleScore(arc());
    expect(result.score).toBeGreaterThanOrEqual(98);
    expect(result.closed).toBe(true);
    expect(result.coverage).toBeGreaterThan(0.95);
  });

  it("never reports outside 0-100, whatever it is handed", () => {
    const strokes = [
      arc(),
      arc({ wobble: 40 }),
      arc({ sweep: 0.3 }),
      arc({ sweep: 0.6, wobble: 25 }),
      arc({ r: 4 }),
      arc({ points: 6 }),
      [],
    ];
    for (const stroke of strokes) {
      const { score } = calculateCircleScore(stroke);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
    }
  });

  it("marks a wobblier stroke lower than a steadier one", () => {
    const steady = calculateCircleScore(arc({ wobble: 3 })).score;
    const shaky = calculateCircleScore(arc({ wobble: 25 })).score;
    expect(steady).toBeGreaterThan(shaky);
  });

  it("knows an arc is not a circle", () => {
    const half = calculateCircleScore(arc({ sweep: 0.5 }));
    expect(half.coverage).toBeLessThan(0.75);
    expect(half.score).toBeLessThan(calculateCircleScore(arc()).score);
  });

  it("spots an unclosed loop and docks it", () => {
    const open = calculateCircleScore(arc({ sweep: 0.8 }));
    expect(open.closed).toBe(false);
    expect(open.score).toBeLessThan(calculateCircleScore(arc()).score);
  });

  it("scores nothing at all for a stroke that barely exists", () => {
    expect(calculateCircleScore([]).score).toBe(0);
    expect(calculateCircleScore(arc({ points: 4 })).score).toBe(0);
  });

  it("refuses to grade a circle too small to have been drawn on purpose", () => {
    const tiny = calculateCircleScore(arc({ r: 3 }));
    expect(tiny.score).toBe(0);
  });

  it("does not care where on the canvas the circle was drawn", () => {
    const left = calculateCircleScore(arc({ cx: 60, cy: 60 })).score;
    const right = calculateCircleScore(arc({ cx: 520, cy: 400 })).score;
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  it("does not care how big the circle is, only how round", () => {
    const small = calculateCircleScore(arc({ r: 40 })).score;
    const large = calculateCircleScore(arc({ r: 180 })).score;
    expect(Math.abs(small - large)).toBeLessThanOrEqual(1);
  });

  it("is deterministic", () => {
    const stroke = arc({ wobble: 12 });
    expect(calculateCircleScore(stroke)).toEqual(calculateCircleScore(stroke));
  });
});

describe("stored value guards", () => {
  it("accepts only a real score", () => {
    expect(isCircleScore(0)).toBe(true);
    expect(isCircleScore(100)).toBe(true);
    expect(isCircleScore(101)).toBe(false);
    expect(isCircleScore(-1)).toBe(false);
    expect(isCircleScore(NaN)).toBe(false);
    expect(isCircleScore("90")).toBe(false);
  });

  it("accepts a history of real scores and nothing else", () => {
    expect(isCircleHistory([])).toBe(true);
    expect(isCircleHistory([10, 90, 100])).toBe(true);
    expect(isCircleHistory([10, 900])).toBe(false);
    expect(isCircleHistory("nope")).toBe(false);
  });

  it("accepts a ghost circle, or none, but not a broken one", () => {
    expect(isCircleGhost(null)).toBe(true);
    expect(isCircleGhost({ centerX: 1, centerY: 2, radius: 3 })).toBe(true);
    expect(isCircleGhost({ centerX: 1, centerY: 2, radius: 0 })).toBe(false);
    expect(isCircleGhost({ centerX: NaN, centerY: 2, radius: 3 })).toBe(false);
    expect(isCircleGhost({ centerX: 1 })).toBe(false);
    expect(isCircleGhost("circle")).toBe(false);
  });
});
