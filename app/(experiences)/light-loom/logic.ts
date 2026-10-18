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
export type Level = {
  name: string;
  grid: Cell[][];
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

const e = (dir: Dir): Cell => ({ kind: "emitter", dir });
const p: Cell = { kind: "prism" };
const m = (k: "mirrorA" | "mirrorB"): Cell => ({ kind: k });
const t = (needs: Exclude<Color, "w">): Cell => ({ kind: "target", needs });
const w: Cell = { kind: "wall" };
const o: Cell = { kind: "empty" };

export const LEVELS: Level[] = [
  {
    name: "Straight and narrow",
    grid: [
      [e(1), o, o, t("r"), o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, w],
    ],
  },
  {
    name: "First refraction",
    grid: [
      [e(1), o, p, o, o, t("r")],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, t("b"), o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
    ],
  },
  {
    name: "Corner shop",
    grid: [
      [e(1), o, o, m("mirrorB"), o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, t("r"), o, w],
    ],
  },
  {
    name: "Prism trio",
    grid: [
      [o, o, t("g"), o, o, o],
      [o, o, o, o, o, o],
      [e(1), o, p, o, o, t("r")],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, t("b"), o, o, o],
    ],
  },
];
