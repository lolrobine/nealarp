import { describe, expect, it } from "vitest";
import { dailyStops, isValidRoute, MAPS, routeLength, scoreRoute } from "./logic";

describe("current-courier maps", () => {
  it("ships seven connected delivery maps with proven routes", () => {
    expect(MAPS).toHaveLength(7);
    for (const map of MAPS) {
      expect(map.stops.length).toBeGreaterThanOrEqual(4);
      expect(isValidRoute(map, map.solution), map.name).toBe(true);
    }
    // The later maps are genuinely bigger grids.
    expect(MAPS[4]!.nodes.length).toBe(16);
    expect(MAPS[6]!.nodes.length).toBeGreaterThanOrEqual(16);
  });

  it("every solution is a single unbroken walk along real edges", () => {
    for (const map of MAPS) {
      const length = routeLength(map.solution, map.edges);
      expect(length, map.name).not.toBeNull();
      expect(length, map.name).toBe(map.par);
    }
  });

  it("routes that skip a stop or teleport are invalid", () => {
    const map = MAPS[0]!;
    expect(isValidRoute(map, ["A1", "B1"])).toBe(false);
    expect(isValidRoute(map, ["A1", "C3", "C1", "A3"])).toBe(false);
  });
});

describe("current-courier scoring", () => {
  it("par routes score 100 and detours cost points", () => {
    const map = MAPS[0]!;
    expect(scoreRoute(map, map.solution)).toBe(100);
    const longer = [...map.solution, "B3", "C3"];
    expect(scoreRoute(map, longer)).toBeLessThan(100);
  });

  it("broken routes score zero", () => {
    expect(scoreRoute(MAPS[0]!, ["B2", "C2"])).toBe(0);
    expect(scoreRoute(MAPS[0]!, [])).toBe(0);
  });
});

describe("current-courier daily stops", () => {
  it("are deterministic per seed", () => {
    const all = MAPS[0]!.nodes;
    const a = dailyStops("seed-one", all, 4);
    const b = dailyStops("seed-one", all, 4);
    expect(a).toEqual(b);
    expect(a).toHaveLength(4);
  });
});
