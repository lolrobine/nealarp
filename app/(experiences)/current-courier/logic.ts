import { seededRandom } from "@/lib/games/daily";

/** Draw one continuous delivery route through every stop on a small city grid.
 * Streets are graph edges; a route is valid when it visits every stop at least once
 * and never lifts the pencil. Shorter routes score higher (Flight Control's drawing
 * language, original maps and scoring). */

export type NodeId = string; // "A1" .. "E5"
export type Edge = { a: NodeId; b: NodeId };
export type DeliveryMap = {
  name: string;
  nodes: NodeId[];
  edges: Edge[];
  stops: NodeId[];
  par: number;
  /** One proven valid route visiting every stop (for tests). */
  solution: NodeId[];
};

export function edgeKey(a: NodeId, b: NodeId): string {
  return [a, b].sort().join("-");
}

export function buildEdges(pairs: [NodeId, NodeId][]): Edge[] {
  return pairs.map(([a, b]) => ({ a, b }));
}

export function routeLength(route: NodeId[], edges: Edge[]): number | null {
  const lookup = new Map<string, Edge>();
  for (const edge of edges) lookup.set(edgeKey(edge.a, edge.b), edge);
  let length = 0;
  for (let i = 1; i < route.length; i++) {
    const edge = lookup.get(edgeKey(route[i - 1]!, route[i]!));
    if (!edge) return null;
    length += 1;
  }
  return length;
}

export function isValidRoute(map: DeliveryMap, route: NodeId[]): boolean {
  if (route.length === 0) return false;
  const visited = new Set(route);
  for (const stop of map.stops) if (!visited.has(stop)) return false;
  return routeLength(route, map.edges) !== null;
}

export function scoreRoute(map: DeliveryMap, route: NodeId[]): number {
  const length = routeLength(route, map.edges);
  if (length === null || !isValidRoute(map, route)) return 0;
  const extra = length - map.par;
  return Math.max(0, Math.min(100, 100 - 8 * extra));
}

/** Deterministic daily map: a shuffled subset of corners become stops. */
export function dailyStops(seed: string, all: NodeId[], count: number): NodeId[] {
  const random = seededRandom(`${seed}:courier`);
  const pool = [...all];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count).sort();
}

export const MAPS: DeliveryMap[] = [
  {
    name: "Corner round",
    nodes: ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"],
    edges: buildEdges([
      ["A1", "B1"],
      ["B1", "C1"],
      ["A2", "B2"],
      ["B2", "C2"],
      ["A3", "B3"],
      ["B3", "C3"],
      ["A1", "A2"],
      ["A2", "A3"],
      ["B1", "B2"],
      ["B2", "B3"],
      ["C1", "C2"],
      ["C2", "C3"],
    ]),
    stops: ["A1", "C1", "C3", "A3"],
    par: 6,
    solution: ["A1", "B1", "C1", "C2", "C3", "B3", "A3"],
  },
  {
    name: "Market weave",
    nodes: ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"],
    edges: buildEdges([
      ["A1", "B1"],
      ["B1", "C1"],
      ["A2", "B2"],
      ["B2", "C2"],
      ["A3", "B3"],
      ["B3", "C3"],
      ["A1", "A2"],
      ["A2", "A3"],
      ["B1", "B2"],
      ["B2", "B3"],
      ["C1", "C2"],
      ["C2", "C3"],
      ["A1", "B2"],
      ["B2", "C3"],
      ["A3", "B2"],
      ["B2", "C1"],
    ]),
    stops: ["A1", "B2", "C3", "C1", "A3"],
    par: 6,
    solution: ["A1", "B2", "C3", "C2", "C1", "B2", "A3"],
  },
  {
    name: "Long block",
    nodes: ["A1", "B1", "C1", "D1", "E1", "A2", "B2", "C2", "D2", "E2"],
    edges: buildEdges([
      ["A1", "B1"],
      ["B1", "C1"],
      ["C1", "D1"],
      ["D1", "E1"],
      ["A2", "B2"],
      ["B2", "C2"],
      ["C2", "D2"],
      ["D2", "E2"],
      ["A1", "A2"],
      ["B1", "B2"],
      ["C1", "C2"],
      ["D1", "D2"],
      ["E1", "E2"],
    ]),
    stops: ["A1", "E1", "E2", "A2", "C1"],
    par: 8,
    solution: ["A1", "A2", "B2", "C2", "D2", "E2", "E1", "D1", "C1"],
  },
  {
    name: "The loop",
    nodes: ["A1", "B1", "C1", "A2", "C2", "A3", "B3", "C3"],
    edges: buildEdges([
      ["A1", "B1"],
      ["B1", "C1"],
      ["C1", "C2"],
      ["C2", "C3"],
      ["C3", "B3"],
      ["B3", "A3"],
      ["A3", "A2"],
      ["A2", "A1"],
      ["B1", "A2"],
      ["C2", "B3"],
    ]),
    stops: ["A1", "C1", "C3", "A3", "B3"],
    par: 8,
    solution: ["A1", "B1", "C1", "C2", "C3", "B3", "A3", "A2", "A1"],
  },
];
