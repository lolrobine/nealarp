/** Hex hop puzzle on an odd-row offset grid. A hop covers 1–2 tiles along one of
 * six directions; the tile you leave crumbles into lava and can never be used again. */

export type Hop = { dir: number; steps: 1 | 2 };
export type HexLevel = {
  name: string;
  rows: string[];
  start: { x: number; y: number };
  goal: { x: number; y: number };
  par: number;
  solution: Hop[];
};
export type HexState = { x: number; y: number; gone: string[] };

const W = 5;
const H = 5;

export function stepHex(x: number, y: number, dir: number): [number, number] {
  const even = y % 2 === 0;
  const dirs = even
    ? [
        [1, 0],
        [-1, 0],
        [0, -1],
        [-1, -1],
        [0, 1],
        [-1, 1],
      ]
    : [
        [1, 0],
        [-1, 0],
        [1, -1],
        [0, -1],
        [1, 1],
        [0, 1],
      ];
  const [dx = 0, dy = 0] = dirs[dir] ?? [0, 0];
  return [x + dx, y + dy];
}

export function hopTarget(level: HexLevel, state: HexState, hop: Hop): [number, number] | null {
  let cx = state.x;
  let cy = state.y;
  for (let step = 1; step <= hop.steps; step++) {
    [cx, cy] = stepHex(cx, cy, hop.dir);
    if (cx < 0 || cy < 0 || cx >= W || cy >= H) return null;
    // Intermediate tiles are leapt over; the landing tile must be solid and intact.
    if (step === hop.steps && (level.rows[cy]?.[cx] ?? ".") === ".") return null;
    if (step === hop.steps && state.gone.includes(`${cx},${cy}`)) return null;
  }
  return [cx, cy];
}

export function applyHop(level: HexLevel, state: HexState, hop: Hop): HexState {
  const target = hopTarget(level, state, hop);
  if (!target) return state;
  return { x: target[0], y: target[1], gone: [...state.gone, `${state.x},${state.y}`] };
}

export function initialState(level: HexLevel): HexState {
  return { x: level.start.x, y: level.start.y, gone: [] };
}

export function isWin(level: HexLevel, state: HexState): boolean {
  return state.x === level.goal.x && state.y === level.goal.y;
}

export function scoreRun(moves: number, par: number): number {
  return Math.max(0, Math.min(100, 100 - 4 * (moves - par)));
}

/** Levels were produced by random search + breadth-first verification:
 * each `solution` wins, and no shorter sequence wins (pars are the BFS depths). */
export const LEVELS: HexLevel[] = [
  {
    name: "Warm up",
    rows: ["###..", "##..#", "#####", "#####", "###.#"],
    start: { x: 4, y: 3 },
    goal: { x: 2, y: 2 },
    par: 2,
    solution: [
      { dir: 1, steps: 2 },
      { dir: 3, steps: 1 },
    ],
  },
  {
    name: "Short cut",
    rows: ["##.##", ".###.", ".#...", "##.##", "#.#.#"],
    start: { x: 0, y: 3 },
    goal: { x: 3, y: 3 },
    par: 2,
    solution: [
      { dir: 0, steps: 1 },
      { dir: 0, steps: 2 },
    ],
  },
  {
    name: "Crossroads",
    rows: ["#####", "##.##", "#.#.#", "#..##", "#####"],
    start: { x: 3, y: 1 },
    goal: { x: 2, y: 4 },
    par: 3,
    solution: [
      { dir: 4, steps: 1 },
      { dir: 5, steps: 2 },
      { dir: 1, steps: 1 },
    ],
  },
  {
    name: "Deep end",
    rows: ["#.###", ".#.##", "....#", "#.###", "#.###"],
    start: { x: 3, y: 0 },
    goal: { x: 4, y: 4 },
    par: 3,
    solution: [
      { dir: 4, steps: 1 },
      { dir: 4, steps: 2 },
      { dir: 5, steps: 1 },
    ],
  },
  {
    name: "Long way round",
    rows: ["#####", "#..##", "...##", "...##", "####."],
    start: { x: 0, y: 4 },
    goal: { x: 4, y: 3 },
    par: 4,
    solution: [
      { dir: 0, steps: 1 },
      { dir: 0, steps: 2 },
      { dir: 2, steps: 1 },
      { dir: 0, steps: 1 },
    ],
  },
  {
    name: "The narrows",
    rows: ["####.", ".####", "##.##", ".#.##", "####."],
    start: { x: 0, y: 4 },
    goal: { x: 4, y: 1 },
    par: 4,
    solution: [
      { dir: 0, steps: 1 },
      { dir: 0, steps: 2 },
      { dir: 2, steps: 1 },
      { dir: 2, steps: 2 },
    ],
  },
  {
    name: "Final crossing",
    rows: [".####", "..###", "#..#.", "#...#", ".#..#"],
    start: { x: 0, y: 3 },
    goal: { x: 4, y: 3 },
    par: 5,
    solution: [
      { dir: 3, steps: 1 },
      { dir: 2, steps: 2 },
      { dir: 0, steps: 2 },
      { dir: 4, steps: 1 },
      { dir: 4, steps: 2 },
    ],
  },
];
