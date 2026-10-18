/** A tiny falling-sand sandbox on a 48×32 grid, simulated with typed arrays.
 * Materials: empty, sand, wall, water. Steps are deterministic: each tick processes
 * cells bottom-up with a fixed left-to-right sweep. */

export const W = 48;
export const H = 32;
export const EMPTY = 0;
export const SAND = 1;
export const WALL = 2;
export const WATER = 3;

export type Grid = Uint8Array;

export function makeGrid(): Grid {
  return new Uint8Array(W * H);
}

export function at(grid: Grid, x: number, y: number): number {
  return grid[y * W + x] ?? EMPTY;
}

export function set(grid: Grid, x: number, y: number, mat: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  grid[y * W + x] = mat;
}

function free(grid: Grid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < W && y < H && grid[y * W + x] === EMPTY;
}

/** A move may only land on a cell no earlier move in this tick has claimed. */
function unclaimed(next: Grid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < W && y < H && next[y * W + x] === EMPTY;
}

/** One deterministic simulation tick. Sand slides down/diagonal-down; water also
 * spreads sideways one cell per tick. A bottom-up left-first sweep gives consistent
 * piles, and claim checks keep grain counts exactly conserved. */
export function step(grid: Grid): Grid {
  const next = grid.slice();
  for (let y = H - 1; y >= 0; y--) {
    for (let x = 0; x < W; x++) {
      const mat = grid[y * W + x]!;
      if (mat === SAND) {
        const below = y + 1 < H ? grid[(y + 1) * W + x]! : WALL;
        const belowNext = y + 1 < H ? next[(y + 1) * W + x]! : WALL;
        if (below === EMPTY && unclaimed(next, x, y + 1)) {
          set(next, x, y, EMPTY);
          set(next, x, y + 1, SAND);
        } else if (below === WATER && belowNext === WATER) {
          // Sink through standing water: the water takes the grain's place.
          set(next, x, y, WATER);
          set(next, x, y + 1, SAND);
        } else if (below === WATER && unclaimed(next, x, y + 1)) {
          // The water already moved this tick: drop into the vacated cell.
          set(next, x, y, EMPTY);
          set(next, x, y + 1, SAND);
        } else if (below !== WATER) {
          const left = x - 1,
            right = x + 1;
          if (free(grid, left, y + 1) && unclaimed(next, left, y + 1)) {
            set(next, x, y, EMPTY);
            set(next, left, y + 1, SAND);
          } else if (free(grid, right, y + 1) && unclaimed(next, right, y + 1)) {
            set(next, x, y, EMPTY);
            set(next, right, y + 1, SAND);
          }
        }
      } else if (mat === WATER) {
        const below = y + 1 < H ? grid[(y + 1) * W + x]! : WALL;
        if (below === EMPTY && unclaimed(next, x, y + 1)) {
          set(next, x, y, EMPTY);
          set(next, x, y + 1, WATER);
        } else if (below !== EMPTY) {
          const side = (x + y) % 2 === 0 ? -1 : 1;
          if (free(grid, x + side, y) && unclaimed(next, x + side, y)) {
            set(next, x, y, EMPTY);
            set(next, x + side, y, WATER);
          } else if (free(grid, x - side, y) && unclaimed(next, x - side, y)) {
            set(next, x, y, EMPTY);
            set(next, x - side, y, WATER);
          }
        }
      }
    }
  }
  return next;
}

export type Goal = {
  id: string;
  name: string;
  hint: string;
  /** Target cells for the sand to occupy. */
  cells: [number, number][];
};

/** Six sculpt goals expressed as target cell lists (x, y) on the 48×32 board. */
export const GOALS: Goal[] = [
  {
    id: "dune",
    name: "The Dune",
    hint: "Build one broad hill in the middle of the board.",
    cells: Array.from({ length: 21 }, (_, i) => {
      const x = 24 + (i % 7) - 3;
      const y = 31 - Math.floor(i / 7);
      return [x, y] as [number, number];
    }),
  },
  {
    id: "hourglass",
    name: "Hourglass",
    hint: "A narrow sand column in the centre, wide at top and bottom.",
    cells: [
      [23, 28],
      [24, 28],
      [25, 28],
      [23, 29],
      [24, 29],
      [25, 29],
      [24, 30],
      [24, 31],
      [23, 31],
      [25, 31],
    ],
  },
  {
    id: "twin-peaks",
    name: "Twin Peaks",
    hint: "Two small hills with a gap between them.",
    cells: [
      [12, 30],
      [12, 31],
      [11, 31],
      [13, 31],
      [35, 30],
      [35, 31],
      [34, 31],
      [36, 31],
    ],
  },
  {
    id: "staircase",
    name: "Staircase",
    hint: "Rising steps from left to right along the floor.",
    cells: [
      [8, 31],
      [14, 31],
      [14, 30],
      [20, 31],
      [20, 30],
      [20, 29],
      [26, 31],
      [26, 30],
      [26, 29],
      [26, 28],
    ],
  },
  {
    id: "arch",
    name: "The Arch",
    hint: "Two pillars with sand bridging the top.",
    cells: [
      [10, 31],
      [10, 30],
      [10, 29],
      [11, 28],
      [12, 28],
      [13, 28],
      [14, 28],
      [15, 29],
      [15, 30],
      [15, 31],
    ],
  },
  {
    id: "shoreline",
    name: "Shoreline",
    hint: "A long thin sandbar sitting just above the floor.",
    cells: Array.from({ length: 16 }, (_, i) => [16 + i, 31] as [number, number]),
  },
];

/** How much of the goal's target is covered by sand — and how little sand strays. */
export function sandScore(grid: Grid, goal: Goal): number {
  const target = new Set(goal.cells.map(([x, y]) => `${x},${y}`));
  let hit = 0;
  let sandCount = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (at(grid, x, y) !== SAND) continue;
      sandCount++;
      if (target.has(`${x},${y}`)) hit++;
    }
  }
  if (goal.cells.length === 0) return 0;
  const coverage = hit / goal.cells.length;
  const precision = sandCount > 0 ? hit / Math.max(sandCount, goal.cells.length) : 0;
  return Math.round(Math.max(0, Math.min(100, (coverage * 0.7 + precision * 0.3) * 100)));
}
