/** Launch a seed around a star and thread it through fruit rings. The simulation uses
 * fixed 1/120 s steps with symplectic Euler integration, so trajectories are identical
 * no matter the frame rate. The optional preview runs the same integrator forward. */

export const DT = 1 / 120;
export const MU = 1_500_000; // standard gravitational parameter of the star (toy units)

export type Body = { x: number; y: number; vx: number; vy: number };
export type Ring = { id: number; x: number; y: number; r: number };
export type Level = {
  name: string;
  origin: Body;
  rings: Ring[];
  launchPower: number;
};

export function stepBody(body: Body): Body {
  const r2 = body.x * body.x + body.y * body.y;
  const r = Math.sqrt(Math.max(r2, 900)); // soft core: never closer than 30 units
  const a = -MU / (r * r * r);
  return {
    x: body.x + body.vx * DT,
    y: body.y + body.vy * DT,
    vx: body.vx + a * body.x * DT,
    vy: body.vy + a * body.y * DT,
  };
}

export function simulate(body: Body, steps: number): Body[] {
  const path: Body[] = [];
  let current = body;
  for (let i = 0; i < steps; i++) {
    current = stepBody(current);
    path.push(current);
  }
  return path;
}

/** Which rings the trajectory threads (entry within the ring radius). */
export function collectedRings(path: Body[], rings: Ring[]): number[] {
  const hit = new Set<number>();
  for (const point of path) {
    for (const ring of rings) {
      if (hit.has(ring.id)) continue;
      if (Math.hypot(point.x - ring.x, point.y - ring.y) <= ring.r) hit.add(ring.id);
    }
  }
  return [...hit].sort((a, b) => a - b);
}

export function launch(angleRad: number, power: number, origin: Body): Body {
  return {
    ...origin,
    vx: Math.cos(angleRad) * power,
    vy: Math.sin(angleRad) * power,
  };
}

export function scoreRun(collected: number, total: number): number {
  return Math.max(0, Math.min(100, Math.round((collected / total) * 100)));
}

export const LEVELS: Level[] = [
  {
    name: "First orbit",
    origin: { x: 0, y: -220, vx: 0, vy: 0 },
    launchPower: 78,
    rings: [
      { id: 0, x: 66, y: -266, r: 30 },
      { id: 1, x: 176, y: -280, r: 30 },
      { id: 2, x: 256, y: -177, r: 30 },
    ],
  },
  {
    name: "Slingshot",
    origin: { x: 180, y: -180, vx: 0, vy: 0 },
    launchPower: 72,
    rings: [
      { id: 0, x: 259, y: -118, r: 27 },
      { id: 1, x: 305, y: 19, r: 27 },
      { id: 2, x: 203, y: 190, r: 27 },
      { id: 3, x: -15, y: 205, r: 27 },
    ],
  },
  {
    name: "Grand tour",
    origin: { x: -200, y: -200, vx: 0, vy: 0 },
    launchPower: 70,
    rings: [
      { id: 0, x: -254, y: -137, r: 25 },
      { id: 1, x: -293, y: -9, r: 25 },
      { id: 2, x: -242, y: 156, r: 25 },
      { id: 3, x: -90, y: 255, r: 25 },
      { id: 4, x: 102, y: 228, r: 25 },
    ],
  },
];

/** Degrees (screen space, y down, 0° = right, clockwise) of a known full-clear
 * launch per level — the rings sit exactly on these simulated trajectories. */
export const HINT_DEGREES = [316, 26, 140];
