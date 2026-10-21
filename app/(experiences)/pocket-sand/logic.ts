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

function isWater(m: number): boolean {
  return m === WATER;
}

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

/** Paint a filled, slightly rounded disc of cells centred on (cx, cy).
 *  radius 0 is a single cell; larger radii make the sand and water tools usable
 *  on a 48x32 grid without a hundred taps. Out-of-bounds cells are ignored. */
export function stamp(grid: Grid, cx: number, cy: number, mat: number, radius = 0): void {
  const reach = radius * radius + radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > reach) continue;
      set(grid, cx + dx, cy + dy, mat);
    }
  }
}

function free(grid: Grid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < W && y < H && grid[y * W + x] === EMPTY;
}

/** A move may only land on a cell no earlier move in this tick has claimed. */
function unclaimed(next: Grid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < W && y < H && next[y * W + x] === EMPTY;
}

/** One deterministic simulation tick. Sand slides down/diagonal-down; water falls,
 * flows over edges, and is then equalised between neighbouring columns — a monotone
 * height levelling that fills cups flat and never drifts or freezes into checkerboards.
 * Claim checks keep every material exactly conserved. */
/** Deterministic pseudo-random sideways preference for a water cell.
 * Mixing the tick in stops a cell from picking the same direction forever
 * (which would make two neighbours trade places endlessly) and avoids the
 * fixed checkerboard that a positional parity produces. */
function flowDir(x: number, y: number, tick: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(tick, 2246822519)) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return (h ^ (h >>> 16)) & 1 ? 1 : -1;
}

export function step(grid: Grid, tick = 0): Grid {
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
        } else if (isWater(below) && isWater(belowNext)) {
          // Sink through standing water: the water takes the grain's place.
          set(next, x, y, belowNext);
          set(next, x, y + 1, SAND);
        } else if (isWater(below) && unclaimed(next, x, y + 1)) {
          // The water already moved this tick: drop into the vacated cell.
          set(next, x, y, EMPTY);
          set(next, x, y + 1, SAND);
        } else if (!isWater(below)) {
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
      } else if (isWater(mat)) {
        const below = y + 1 < H ? grid[(y + 1) * W + x]! : WALL;
        // 1) Fall — including into gaps that opened this tick. Checking `next`
        // rather than `grid` is what makes that true: cells are swept bottom-up,
        // so the cell underneath may already have flowed away this tick. Reading
        // the stale grid instead left water hanging in mid-air above its own
        // puddle, and the puddle churning underneath never let it land.
        if (below !== WALL && y + 1 < H && unclaimed(next, x, y + 1)) {
          set(next, x, y, EMPTY);
          set(next, x, y + 1, WATER);
          continue;
        }
        // Preferred sideways direction. A hash of (x, y, tick) keeps this
        // reproducible while breaking up the diagonal banding that a plain
        // (x + y) % 2 parity used to stamp across the whole body of water.
        const side = flowDir(x, y, tick);
        // 2) Flow diagonally over open edges into holes below.
        let moved = false;
        for (const s of [side, -side]) {
          if (free(grid, x + s, y + 1) && unclaimed(next, x + s, y + 1)) {
            set(next, x, y, EMPTY);
            set(next, x + s, y + 1, WATER);
            moved = true;
            break;
          }
        }
        if (moved) continue;
        // 3) Spread sideways under pressure. Without this a water cell only
        // ever moves down or diagonally — exactly like sand — so it settles
        // into a pyramid with a 45° slope instead of finding its level.
        // The pressure test (water resting on top of this cell) is what keeps
        // the flow physical: a puddle that is already one cell deep has nothing
        // pushing it, so it stays put instead of creeping off to the edges.
        // A grain resting directly on top pins the water: it is about to sink
        // in and trade places, so sliding out from under it would teleport the
        // puddle sideways instead of letting the sand displace it.
        if (y > 0 && grid[(y - 1) * W + x] === SAND) continue;
        const pressed = y > 0 && grid[(y - 1) * W + x] === WATER;
        for (const s of [side, -side]) {
          if (!free(grid, x + s, y) || !unclaimed(next, x + s, y)) continue;
          // Two reasons to step sideways, and only these two. Either water is
          // stacked on top and pushes this cell out, or the step leads onto the
          // surface of the body next door and so flattens a one-cell terrace —
          // the terraces are what used to pile up into a 45° sand pyramid.
          // A lone puddle one cell deep satisfies neither, so it stays put
          // rather than creeping across the floor into scattered droplets.
          const ontoWater = y + 1 < H && grid[(y + 1) * W + x + s] === WATER;
          if (!pressed && !ontoWater) continue;
          set(next, x, y, EMPTY);
          set(next, x + s, y, WATER);
          break;
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
