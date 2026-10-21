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

/** The board prints "par pays 100" and the worked example calls par the shortest route.
 *  The older tests only proved that the authored walk is *as long as* par, which would
 *  still pass if par drifted above the real optimum. This solves each map from scratch. */
describe("current-courier pars are the true optimum", () => {
  /** Shortest walk (in edges) that touches every stop, over all start nodes.
   *  State is (node, visited-stop bitmask), so repeated junctions are allowed. */
  function shortestCoveringWalk(map: (typeof MAPS)[number]): number {
    const adjacency = new Map<string, string[]>();
    for (const node of map.nodes) adjacency.set(node, []);
    for (const edge of map.edges) {
      adjacency.get(edge.a)!.push(edge.b);
      adjacency.get(edge.b)!.push(edge.a);
    }
    const stopIndex = new Map(map.stops.map((stop, i) => [stop, i]));
    const complete = (1 << map.stops.length) - 1;
    let best = Infinity;
    for (const start of map.nodes) {
      const startMask = stopIndex.has(start) ? 1 << stopIndex.get(start)! : 0;
      const seen = new Set<string>([`${start}|${startMask}`]);
      let frontier: { node: string; mask: number }[] = [{ node: start, mask: startMask }];
      let depth = 0;
      while (frontier.length && depth < best) {
        if (frontier.some((state) => state.mask === complete)) break;
        const next: { node: string; mask: number }[] = [];
        for (const state of frontier) {
          for (const neighbour of adjacency.get(state.node) ?? []) {
            const mask = stopIndex.has(neighbour)
              ? state.mask | (1 << stopIndex.get(neighbour)!)
              : state.mask;
            const key = `${neighbour}|${mask}`;
            if (seen.has(key)) continue;
            seen.add(key);
            next.push({ node: neighbour, mask });
          }
        }
        frontier = next;
        depth += 1;
        if (frontier.some((state) => state.mask === complete)) {
          best = Math.min(best, depth);
          break;
        }
      }
      if (startMask === complete) best = 0;
    }
    return best;
  }

  it("no map can be delivered in fewer streets than its par", () => {
    for (const map of MAPS) {
      expect(shortestCoveringWalk(map), map.name).toBe(map.par);
    }
  });

  it("the worked example on the board is a real par route", () => {
    const corner = MAPS[0]!;
    const walked = ["A1", "B1", "C1", "C2", "C3", "B3", "A3"];
    expect(corner.name).toBe("Corner round");
    expect(routeLength(walked, corner.edges)).toBe(6);
    expect(isValidRoute(corner, walked)).toBe(true);
    expect(scoreRoute(corner, walked)).toBe(100);
  });
});
