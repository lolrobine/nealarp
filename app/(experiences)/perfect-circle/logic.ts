/**
 * The maths behind Perfect Circle, lifted out of the component.
 *
 * Fitting a circle to a stroke and grading it are pure functions of the
 * points; they only lived inside page.tsx because that is where they were
 * written. Out here they can be tested without a canvas, which jsdom cannot
 * give us anyway.
 */

export type Point = { x: number; y: number };

export function kasaCircleFit(
  points: Point[]
): { centerX: number; centerY: number; radius: number } | null {
  if (points.length < 5) return null;

  let sumX = 0,
    sumY = 0,
    sumX2 = 0,
    sumY2 = 0,
    sumXY = 0,
    sumZ = 0,
    sumXZ = 0,
    sumYZ = 0;
  const n = points.length;

  for (const p of points) {
    const x = p.x;
    const y = p.y;
    const z = x * x + y * y;
    sumX += x;
    sumY += y;
    sumX2 += x * x;
    sumY2 += y * y;
    sumXY += x * y;
    sumZ += z;
    sumXZ += x * z;
    sumYZ += y * z;
  }

  // Build normal equations for A,B,C where z = A x + B y + C
  // [ sumX2 sumXY sumX ] [A] = [sumXZ]
  // [ sumXY sumY2 sumY ] [B]   [sumYZ]
  // [ sumX  sumY  n   ] [C]   [sumZ]
  const M00 = sumX2,
    M01 = sumXY,
    M02 = sumX;
  const M10 = sumXY,
    M11 = sumY2,
    M12 = sumY;
  const M20 = sumX,
    M21 = sumY,
    M22 = n;

  const v0 = sumXZ,
    v1 = sumYZ,
    v2 = sumZ;

  // Solve 3x3 via Cramer's rule / determinant
  const det =
    M00 * (M11 * M22 - M12 * M21) - M01 * (M10 * M22 - M12 * M20) + M02 * (M10 * M21 - M11 * M20);

  if (Math.abs(det) < 1e-8) {
    // Fallback to average center
    const avgX = sumX / n;
    const avgY = sumY / n;
    const avgR = points.reduce((acc, p) => acc + Math.hypot(p.x - avgX, p.y - avgY), 0) / n;
    return { centerX: avgX, centerY: avgY, radius: avgR };
  }

  const invDet = 1 / det;

  const detA =
    v0 * (M11 * M22 - M12 * M21) - M01 * (v1 * M22 - M12 * v2) + M02 * (v1 * M21 - M11 * v2);

  const detB =
    M00 * (v1 * M22 - M12 * v2) - v0 * (M10 * M22 - M12 * M20) + M02 * (M10 * v2 - v1 * M20);

  const detC =
    M00 * (M11 * v2 - v1 * M21) - M01 * (M10 * v2 - v1 * M20) + v0 * (M10 * M21 - M11 * M20);

  const A = detA * invDet;
  const B = detB * invDet;
  const C = detC * invDet;

  const centerX = A / 2;
  const centerY = B / 2;
  const radius = Math.sqrt(Math.max(0, C + centerX * centerX + centerY * centerY));

  return { centerX, centerY, radius };
}

export function calculateCircleScore(points: Point[]): {
  score: number;
  centerX: number;
  centerY: number;
  radius: number;
  closed: boolean;
  coverage: number;
} {
  if (points.length < 5)
    return { score: 0, centerX: 0, centerY: 0, radius: 0, closed: false, coverage: 0 };

  const fit = kasaCircleFit(points);
  if (!fit) return { score: 0, centerX: 0, centerY: 0, radius: 0, closed: false, coverage: 0 };
  const { centerX, centerY, radius } = fit;
  if (radius < 5) return { score: 0, centerX, centerY, radius, closed: false, coverage: 0 };

  // Distance deviation
  const distances = points.map((p) => Math.hypot(p.x - centerX, p.y - centerY));
  const avgDeviation =
    distances.reduce((acc, d) => acc + Math.abs(d - radius), 0) / distances.length;
  const normalizedDeviation = Math.min(avgDeviation / (radius * 0.5), 1);
  let score = (1 - normalizedDeviation) * 100;

  // Closure check: distance between first and last point relative to radius
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const closureDist = Math.hypot(first.x - last.x, first.y - last.y);
  const closed = closureDist < radius * 0.5 + 20; // allow some gap
  if (!closed) {
    // Penalize unclosed circles heavily, but not to zero
    score *= 0.6;
  }

  // Angular coverage: check if points cover full 360°
  const angles = points.map((p) => Math.atan2(p.y - centerY, p.x - centerX));
  angles.sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < angles.length; i++) {
    const gap = angles[i]! - angles[i - 1]!;
    if (gap > maxGap) maxGap = gap;
  }
  // Gap between last and first (wrap around)
  const wrapGap = angles[0]! + Math.PI * 2 - angles[angles.length - 1]!;
  if (wrapGap > maxGap) maxGap = wrapGap;
  const coverage = 1 - maxGap / (Math.PI * 2); // 1 = full coverage
  // If coverage < 75%, penalize
  if (coverage < 0.75) {
    score *= 0.5 + coverage * 0.5; // 0.5 to 0.875 multiplier
  }

  return {
    score: Math.max(0, Math.round(score)),
    centerX,
    centerY,
    radius,
    closed,
    coverage,
  };
}

export type CircleGhost = { centerX: number; centerY: number; radius: number };
export function isCircleScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}
export function isCircleHistory(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isCircleScore);
}
export function isCircleGhost(value: unknown): value is CircleGhost | null {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  const circle = value as Partial<CircleGhost>;
  return (
    [circle.centerX, circle.centerY, circle.radius].every(
      (n) => typeof n === "number" && Number.isFinite(n)
    ) && circle.radius! > 0
  );
}
