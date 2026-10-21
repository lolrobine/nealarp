/** Light Loom: trace coloured beams across a small grid. A prism splits white light
 * into red (straight on), green (turn left) and blue (turn right); mirrors turn any
 * beam a quarter turn; targets are won when their required colour reaches them.
 * The tracer is pure and fully deterministic (Lazors-style optics, original rules). */

export const SIZE = 6;

export type Color = "r" | "g" | "b" | "w";
export type Dir = 0 | 1 | 2 | 3; // up, right, down, left
export type Kind = "empty" | "wall" | "prism" | "mirrorA" | "mirrorB" | "target" | "emitter";
export type Cell = {
  kind: Kind;
  dir?: Dir;
  /** For targets: which single colour wins the cell. */
  needs?: Exclude<Color, "w">;
};
/** The optics the player places. Fixed cells (emitter, wall, target) are never in a tray. */
export type PieceKind = "prism" | "mirrorA" | "mirrorB";
export type Placement = { x: number; y: number; kind: PieceKind };

export type Level = {
  name: string;
  /** Fixed board: emitters, walls, targets and empty cells. Never contains tray pieces. */
  grid: Cell[][];
  /** Optics the player has to place to light every target. */
  tray: PieceKind[];
  /** One proven placement set that solves the level (verified in logic.test.ts). */
  solution: Placement[];
};

export type Beam = { x: number; y: number; dir: Dir; color: Exclude<Color, "w"> };

export const DIR_VECTORS: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export function turnLeft(dir: Dir): Dir {
  return ((dir + 3) % 4) as Dir;
}
export function turnRight(dir: Dir): Dir {
  return ((dir + 1) % 4) as Dir;
}
/** mirrorA ("/"): up↔right, down↔left. mirrorB ("\\"): up↔left, down↔right. */
export function reflect(kind: "mirrorA" | "mirrorB", dir: Dir): Dir {
  if (kind === "mirrorA") return ([1, 0, 3, 2] as Dir[])[dir]!;
  return ([3, 2, 1, 0] as Dir[])[dir]!;
}

export function emitterBeams(level: Level): Beam[] {
  const beams: Beam[] = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = level.grid[y]?.[x];
      if (cell?.kind === "emitter")
        beams.push({ x, y, dir: cell.dir ?? 1, color: "w" as Exclude<Color, "w"> });
    }
  }
  // Emitters shine white; the tracer splits them via prisms. Represent white as all three.
  return beams.flatMap((b) => (["r", "g", "b"] as const).map((color) => ({ ...b, color })));
}

export type TraceResult = {
  /** cell key "x,y" → set of colours that land there. */
  lit: Map<string, Set<string>>;
  litTargets: { x: number; y: number; color: string }[];
};

export function traceBeams(level: Level): TraceResult {
  const lit = new Map<string, Set<string>>();
  const litTargets: { x: number; y: number; color: string }[] = [];
  const queue: Beam[] = emitterBeams(level);
  const seen = new Set<string>();
  while (queue.length) {
    const beam = queue.shift()!;
    const key = `${beam.x},${beam.y},${beam.dir},${beam.color}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cell = level.grid[beam.y]?.[beam.x];
    if (!cell) continue;
    const cellKey = `${beam.x},${beam.y}`;
    if (!lit.has(cellKey)) lit.set(cellKey, new Set());
    lit.get(cellKey)!.add(beam.color);
    if (cell.kind === "target" && cell.needs === beam.color) {
      litTargets.push({ x: beam.x, y: beam.y, color: beam.color });
    }
    if (cell.kind === "wall") continue;

    const [dx, dy] = DIR_VECTORS[beam.dir]!;
    const nx = beam.x + dx;
    const ny = beam.y + dy;
    if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;

    const nextCell = level.grid[ny]?.[nx];
    if (!nextCell) continue;

    if (nextCell.kind === "prism") {
      // White components split: red continues, green turns left, blue turns right.
      const splitDir: Dir =
        beam.color === "r"
          ? beam.dir
          : beam.color === "g"
            ? turnLeft(beam.dir)
            : turnRight(beam.dir);
      const [sdx, sdy] = DIR_VECTORS[splitDir]!;
      queue.push({ x: nx, y: ny, dir: splitDir, color: beam.color });
      // Prism itself also transmits straight for completeness of lighting.
      void sdx;
      void sdy;
      continue;
    }
    if (nextCell.kind === "mirrorA" || nextCell.kind === "mirrorB") {
      const newDir = reflect(nextCell.kind, beam.dir);
      queue.push({ x: nx, y: ny, dir: newDir, color: beam.color });
      continue;
    }
    queue.push({ x: nx, y: ny, dir: beam.dir, color: beam.color });
  }
  return { lit, litTargets };
}

export function isSolved(level: Level): boolean {
  const { lit } = traceBeams(level);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = level.grid[y]?.[x];
      if (cell?.kind !== "target") continue;
      const colors = lit.get(`${x},${y}`);
      if (!cell.needs || !colors?.has(cell.needs)) return false;
    }
  }
  return true;
}

/** True when (x, y) is a free square the player may drop an optic onto. */
export function canPlace(level: Level, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return false;
  return level.grid[y]?.[x]?.kind === "empty";
}

/** Compose the fixed board with the player's optics into a traceable level. */
export function withPlacements(level: Level, placements: Placement[]): Level {
  const grid = level.grid.map((row) => row.map((cell) => ({ ...cell })));
  for (const placement of placements) {
    if (!canPlace(level, placement.x, placement.y)) continue;
    grid[placement.y]![placement.x] = { kind: placement.kind };
  }
  return { ...level, grid };
}

const e = (dir: Dir): Cell => ({ kind: "emitter", dir });
const t = (needs: Exclude<Color, "w">): Cell => ({ kind: "target", needs });
const w: Cell = { kind: "wall" };
const o: Cell = { kind: "empty" };

export const LEVELS: Level[] = [
  {
    // One mirror: the beam runs east along row 1, then must be bent south to the target.
    name: "Straight and narrow",
    grid: [
      [e(1), o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, t("r")],
    ],
    tray: ["mirrorB"],
    solution: [{ x: 5, y: 0, kind: "mirrorB" }],
  },
  {
    // One prism: red carries straight to the east target, blue turns south to the low target.
    name: "First refraction",
    grid: [
      [e(1), o, o, o, o, t("r")],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, t("b"), o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
    ],
    tray: ["prism"],
    solution: [{ x: 2, y: 0, kind: "prism" }],
  },
  {
    // Two mirrors: south at the top wall, then west along row 4 to the target.
    name: "Corner shop",
    grid: [
      [e(1), o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [t("r"), o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, w],
    ],
    tray: ["mirrorB", "mirrorA"],
    solution: [
      { x: 3, y: 0, kind: "mirrorB" },
      { x: 3, y: 3, kind: "mirrorA" },
    ],
  },
  {
    // Mirror into a prism: one split feeds three targets at once.
    name: "Prism trio",
    grid: [
      [e(2), o, t("g"), o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, t("r")],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, t("b"), o, o, o],
    ],
    tray: ["mirrorB", "prism"],
    solution: [
      { x: 0, y: 2, kind: "mirrorB" },
      { x: 2, y: 2, kind: "prism" },
    ],
  },
];
