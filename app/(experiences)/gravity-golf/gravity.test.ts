import { expect, it } from "vitest";
import { gravityAcceleration, simulateFlight, GOLF_LEVELS } from "./logic";
it("attracts toward a planet, weakens with squared distance and sums sources", () => {
  const planet = { x: 100, y: 100, radius: 10, gravity: 10000 };
  const near = gravityAcceleration([planet], { x: 50, y: 100 });
  const far = gravityAcceleration([planet], { x: 0, y: 100 });
  expect(near.x).toBeCloseTo(far.x * 4);
  expect(near.y).toBe(0);
  expect(near.x).toBeGreaterThan(0);
  expect(gravityAcceleration([planet, { ...planet, x: 0 }], { x: 50, y: 100 }).x).toBeCloseTo(0);
});
it("has nine courses and visibly curves a flight toward a gravity source", () => {
  expect(GOLF_LEVELS).toHaveLength(9);
  const level = {
    name: "Attraction test",
    start: { x: 30, y: 180 },
    goal: { x: 590, y: 20 },
    planets: [{ x: 300, y: 250, radius: 20, gravity: 300000 }],
    walls: [],
  };
  const curved = simulateFlight(level, 0, 150).path,
    straight = simulateFlight({ ...level, planets: [] }, 0, 150).path;
  expect(Math.max(...curved.map((p) => p.y))).toBeGreaterThan(200);
  expect(straight.every((p) => p.y === 180)).toBe(true);
});
