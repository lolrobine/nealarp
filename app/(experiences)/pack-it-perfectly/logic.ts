export type Cell = [number, number];
export type Piece = { id: string; cells: Cell[] };
export type Placement = { id: string; x: number; y: number; rotation: number };
export type PackingLevel = {
  name: string;
  width: number;
  height: number;
  pieces: Piece[];
  solution: Placement[];
};
function rect(w: number, h: number): Cell[] {
  return Array.from({ length: w * h }, (_, i) => [i % w, Math.floor(i / w)]);
}
export const LEVELS: PackingLevel[] = [
  {
    name: "Weekend bag",
    width: 4,
    height: 3,
    pieces: [
      { id: "A", cells: rect(2, 2) },
      { id: "B", cells: rect(2, 2) },
      { id: "C", cells: rect(4, 1) },
    ],
    solution: [
      { id: "A", x: 0, y: 0, rotation: 0 },
      { id: "B", x: 2, y: 0, rotation: 0 },
      { id: "C", x: 0, y: 2, rotation: 0 },
    ],
  },
  {
    name: "Around the corners",
    width: 4,
    height: 4,
    pieces: [
      {
        id: "A",
        cells: [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
      },
      {
        id: "B",
        cells: [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
      },
      { id: "C", cells: rect(2, 2) },
      { id: "D", cells: rect(2, 2) },
      { id: "E", cells: rect(2, 1) },
    ],
    solution: [
      { id: "A", x: 0, y: 0, rotation: 0 },
      { id: "B", x: 2, y: 0, rotation: 0 },
      { id: "C", x: 0, y: 2, rotation: 0 },
      { id: "D", x: 2, y: 2, rotation: 0 },
      { id: "E", x: 1, y: 1, rotation: 0 },
    ],
  },
  {
    name: "Long holiday",
    width: 5,
    height: 4,
    pieces: [
      { id: "A", cells: rect(3, 2) },
      { id: "B", cells: rect(2, 3) },
      { id: "C", cells: rect(3, 2) },
      { id: "D", cells: rect(2, 1) },
    ],
    solution: [
      { id: "A", x: 0, y: 0, rotation: 0 },
      { id: "B", x: 3, y: 0, rotation: 0 },
      { id: "C", x: 0, y: 2, rotation: 0 },
      { id: "D", x: 3, y: 3, rotation: 0 },
    ],
  },
];
export function rotate(cells: Cell[], turns: number): Cell[] {
  let result = cells.map(([x, y]): Cell => [x, y]);
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) {
    result = result.map(([x, y]) => [-y, x]);
    const minX = Math.min(...result.map((c) => c[0])),
      minY = Math.min(...result.map((c) => c[1]));
    result = result.map(([x, y]) => [x - minX, y - minY]);
  }
  return result;
}
export function occupied(level: PackingLevel, placements: Placement[]) {
  const cells = new Map<string, string>();
  for (const p of placements) {
    const piece = level.pieces.find((item) => item.id === p.id);
    if (!piece) continue;
    for (const [x, y] of rotate(piece.cells, p.rotation)) cells.set(`${p.x + x},${p.y + y}`, p.id);
  }
  return cells;
}
export function canPlace(level: PackingLevel, placements: Placement[], next: Placement) {
  const piece = level.pieces.find((p) => p.id === next.id);
  if (
    !piece ||
    placements.some((p) => p.id === next.id) ||
    ![next.x, next.y, next.rotation].every(Number.isInteger)
  )
    return false;
  const used = occupied(level, placements);
  return rotate(piece.cells, next.rotation).every(
    ([x, y]) =>
      next.x + x >= 0 &&
      next.y + y >= 0 &&
      next.x + x < level.width &&
      next.y + y < level.height &&
      !used.has(`${next.x + x},${next.y + y}`)
  );
}
export function packingScore(moves: number, pieces: number) {
  return Math.max(0, 100 - Math.max(0, moves - pieces) * 5);
}
