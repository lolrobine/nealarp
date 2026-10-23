export type Point = { x: number; y: number };
export type Planet = Point & { radius: number; gravity: number };
export type GolfLevel = {
  name: string;
  start: Point;
  goal: Point;
  planets: Planet[];
  walls: { x: number; y: number; w: number; h: number }[];
};
export const GOLF_LEVELS: GolfLevel[] = [
  {
    name: "First orbit",
    start: { x: 60, y: 280 },
    goal: { x: 535, y: 80 },
    planets: [{ x: 300, y: 230, radius: 28, gravity: 288000 }],
    walls: [],
  },
  {
    name: "Twin moons",
    start: { x: 55, y: 290 },
    goal: { x: 540, y: 65 },
    planets: [
      { x: 230, y: 260, radius: 24, gravity: 180000 },
      { x: 400, y: 200, radius: 22, gravity: 180000 },
    ],
    walls: [],
  },
  {
    name: "The gate",
    start: { x: 55, y: 280 },
    goal: { x: 540, y: 75 },
    planets: [{ x: 290, y: 250, radius: 25, gravity: 216000 }],
    walls: [{ x: 330, y: 160, w: 16, h: 200 }],
  },
  {
    name: "Slingshot valley",
    start: { x: 60, y: 290 },
    goal: { x: 535, y: 90 },
    planets: [{ x: 260, y: 235, radius: 34, gravity: 450000 }],
    walls: [],
  },
  {
    name: "The high road",
    start: { x: 60, y: 280 },
    goal: { x: 535, y: 80 },
    planets: [{ x: 275, y: 110, radius: 32, gravity: 350000 }],
    walls: [{ x: 310, y: 220, w: 16, h: 110 }],
  },
  {
    name: "Binary gate",
    start: { x: 55, y: 290 },
    goal: { x: 545, y: 65 },
    planets: [
      { x: 210, y: 215, radius: 26, gravity: 230000 },
      { x: 400, y: 150, radius: 30, gravity: 200000 },
    ],
    walls: [{ x: 300, y: 240, w: 14, h: 120 }],
  },
  {
    name: "Ringed giant",
    start: { x: 55, y: 290 },
    goal: { x: 540, y: 65 },
    planets: [{ x: 320, y: 210, radius: 40, gravity: 480000 }],
    walls: [{ x: 200, y: 250, w: 12, h: 110 }],
  },
  {
    name: "Crosscurrents",
    start: { x: 55, y: 290 },
    goal: { x: 540, y: 80 },
    planets: [
      { x: 180, y: 115, radius: 22, gravity: 150000 },
      { x: 370, y: 250, radius: 32, gravity: 320000 },
    ],
    walls: [],
  },
  {
    name: "The final arc",
    start: { x: 55, y: 290 },
    goal: { x: 540, y: 65 },
    planets: [
      { x: 200, y: 255, radius: 26, gravity: 250000 },
      { x: 350, y: 130, radius: 24, gravity: 220000 },
      { x: 460, y: 260, radius: 28, gravity: 200000 },
    ],
    walls: [{ x: 280, y: 200, w: 12, h: 140 }],
  },
];
export type Flight = { path: Point[]; outcome: "goal" | "collision" | "out" | "timeout" };
/** Attractive inverse-square acceleration, summed across every stationary planet. */
export function gravityAcceleration(planets: Planet[], point: Point): Point {
  let x = 0,
    y = 0;
  for (const p of planets) {
    const dx = p.x - point.x,
      dy = p.y - point.y,
      d2 = Math.max(p.radius * p.radius, dx * dx + dy * dy),
      distance = Math.sqrt(d2);
    x += ((dx / distance) * p.gravity) / d2;
    y += ((dy / distance) * p.gravity) / d2;
  }
  return { x, y };
}
/** Fixed 1/120 s semi-implicit integration; toy units, stationary gravity sources, no real orbital claims. */
export function simulateFlight(level: GolfLevel, angle: number, power: number): Flight {
  if (!Number.isFinite(angle) || !Number.isFinite(power) || power < 1 || power > 250)
    throw new Error("Invalid launch");
  const rad = (angle * Math.PI) / 180;
  let x = level.start.x,
    y = level.start.y,
    vx = Math.cos(rad) * power,
    vy = -Math.sin(rad) * power;
  const path: Point[] = [{ x, y }],
    dt = 1 / 120;
  for (let i = 0; i < 120 * 12; i++) {
    const acceleration = gravityAcceleration(level.planets, { x, y });
    vx += acceleration.x * dt;
    vy += acceleration.y * dt;
    x += vx * dt;
    y += vy * dt;
    // Detect every integration step, independently of rendered path sampling.
    let outcome: Flight["outcome"] | null = null;
    if (Math.hypot(x - level.goal.x, y - level.goal.y) <= 22) outcome = "goal";
    else if (
      level.planets.some((p) => Math.hypot(x - p.x, y - p.y) <= p.radius + 4) ||
      level.walls.some(
        (w) => x >= w.x - 4 && x <= w.x + w.w + 4 && y >= w.y - 4 && y <= w.y + w.h + 4
      )
    )
      outcome = "collision";
    else if (x < 0 || x > 600 || y < 0 || y > 360) outcome = "out";
    if (i % 4 === 0 || outcome) path.push({ x, y });
    if (outcome) return { path, outcome };
  }
  return { path, outcome: "timeout" };
}
export function golfScore(shots: number) {
  // Clamped at both ends: every other score in the project is, and an
  // unclamped top means a hypothetical zero-shot hole pays 110.
  return Math.max(0, Math.min(100, 100 - (shots - 1) * 10));
}
