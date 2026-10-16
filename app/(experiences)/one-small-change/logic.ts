export type Sample = { time: number; height: number };
export type BounceResult = { samples: Sample[]; bounces: number; distance: number };
/** Toy vertical drop: height 5 m, g = 9.81 m/s² assumed constant, no air resistance. */
export function bounceExperiment(restitution: number): BounceResult {
  if (!Number.isFinite(restitution) || restitution < 0.2 || restitution > 0.95)
    throw new Error("Restitution must be 0.2–0.95");
  let h = 5,
    v = 0,
    bounces = 0,
    distance = 0,
    resting = false;
  const dt = 1 / 240,
    samples: Sample[] = [{ time: 0, height: h }];
  for (let i = 1; i <= 8 * 240; i++) {
    const previous = h;
    if (!resting) {
      v -= 9.81 * dt;
      h += v * dt;
      if (h <= 0) {
        h = 0;
        v = -v * restitution;
        bounces++;
        if (v < 0.1) {
          v = 0;
          resting = true;
        }
      }
    }
    distance += Math.abs(h - previous);
    if (i % 4 === 0) samples.push({ time: i * dt, height: h });
  }
  return { samples, bounces, distance };
}
