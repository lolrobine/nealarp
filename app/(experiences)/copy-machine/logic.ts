export type Pt = { x: number; y: number };
export type Stroke = Pt[];
export type Drawing = Stroke[];

export function strokeLength(points: Stroke): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

/** Equal arc-length resampling of a polyline. */
export function resample(points: Stroke, n = 32): Stroke {
  if (points.length === 0) return [];
  const length = strokeLength(points);
  if (points.length === 1 || length === 0)
    return Array.from({ length: n }, () => ({ ...points[0]! }));
  const step = length / (n - 1);
  const result: Stroke = [{ ...points[0]! }];
  let segmentIndex = 1;
  let a = points[0]!;
  let b = points[1]!;
  let distanceDone = 0;
  let nextTarget = step;
  while (result.length < n && segmentIndex < points.length) {
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    const segStart = distanceDone;
    const segEnd = distanceDone + seg;
    if (seg === 0) {
      segmentIndex++;
      a = b;
      b = points[segmentIndex] ?? b;
      continue;
    }
    if (nextTarget <= segEnd + 1e-9) {
      const t = (nextTarget - segStart) / seg;
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      nextTarget += step;
    } else {
      distanceDone = segEnd;
      segmentIndex++;
      a = b;
      b = points[segmentIndex] ?? b;
    }
  }
  while (result.length < n) result.push({ ...points[points.length - 1]! });
  return result;
}

/** Center on the drawing's bounding box and scale its longest side to 1. */
export function normalize(drawing: Drawing): Drawing {
  const all = drawing.flat();
  if (all.length === 0) return [];
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const scale = Math.max(maxX - minX, maxY - minY) || 1;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return drawing.map((stroke) =>
    stroke.map((p) => ({ x: (p.x - cx) / scale, y: (p.y - cy) / scale }))
  );
}

export function flattenResampled(drawing: Drawing): Pt[] {
  return normalize(drawing)
    .map((stroke) => resample(stroke, stroke.length < 2 ? 8 : 24))
    .flat();
}

/** Symmetric mean nearest-neighbour distance between two normalized point sets. */
export function chamfer(a: Pt[], b: Pt[]): number {
  if (a.length === 0 || b.length === 0) return Number.POSITIVE_INFINITY;
  const mean = (from: Pt[], to: Pt[]) =>
    from.reduce((sum, p) => {
      let best = Number.POSITIVE_INFINITY;
      for (const q of to) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
      return sum + best;
    }, 0) / from.length;
  return (mean(a, b) + mean(b, a)) / 2;
}

export const COPY_FLOOR = 0.45;

/** 0-100 similarity between model and copy drawings; identical drawings score 100. */
export function copyScore(model: Drawing, copy: Drawing): number {
  const a = flattenResampled(model);
  const b = flattenResampled(copy);
  if (a.length === 0 || b.length === 0) return 0;
  const distance = chamfer(a, b);
  return Math.round(Math.max(0, Math.min(100, 100 * (1 - distance / COPY_FLOOR))));
}

/** Average of consecutive-generation copy scores over a lineage of drawings. */
export function stabilityScore(lineage: Drawing[]): number {
  if (lineage.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < lineage.length; i++) total += copyScore(lineage[i - 1]!, lineage[i]!);
  return Math.round(total / (lineage.length - 1));
}
