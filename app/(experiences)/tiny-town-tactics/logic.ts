import { seededRandom } from "@/lib/games/daily";

/** A placement puzzle in the spirit of ISLANDERS (The Station): lay tiles on an 8×8
 * board and score through adjacency rules. The rules below are the complete scoring
 * sheet — nothing is hidden. */

export const SIZE = 8;
export const PLACEMENTS = 16;
export const TARGET_SCORE = 320;

export type Tile = "house" | "park" | "shop" | "factory" | "pond" | null;
export type Board = Tile[];

export const TILE_TYPES: Exclude<Tile, null>[] = ["house", "park", "shop", "factory", "pond"];

export function makeBoard(): Board {
  return Array(SIZE * SIZE).fill(null);
}

export function at(board: Board, x: number, y: number): Tile {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
  return board[y * SIZE + x] ?? null;
}

export function neighbours(x: number, y: number): [number, number][] {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
}

/** Score for placing `tile` at (x, y) on `board` (neighbours already placed). */
export function placementScore(
  board: Board,
  x: number,
  y: number,
  tile: Exclude<Tile, null>
): number {
  let score = 1;
  for (const [nx, ny] of neighbours(x, y)) {
    const n = at(board, nx, ny);
    if (tile === "house") {
      if (n === "park" || n === "pond") score += 3;
      if (n === "factory") score -= 2;
      if (n === "shop") score += 1;
    } else if (tile === "park") {
      if (n === "house" || n === "pond") score += 2;
      if (n === "factory") score -= 1;
    } else if (tile === "shop") {
      if (n === "house") score += 2;
      if (n === "shop") score += 1;
    } else if (tile === "factory") {
      if (n === "factory") score += 4;
      if (n === "house" || n === "park") score -= 1;
    } else if (tile === "pond") {
      if (n === "pond") score += 1;
      if (n === "park") score += 2;
      if (n === "factory") score -= 1;
    }
  }
  return score;
}

export function place(
  board: Board,
  x: number,
  y: number,
  tile: Exclude<Tile, null>
): { board: Board; gained: number } {
  if (at(board, x, y) !== null) return { board, gained: 0 };
  const gained = placementScore(board, x, y, tile);
  const next = [...board];
  next[y * SIZE + x] = tile;
  return { board: next, gained };
}

/** Deterministic 16-tile sequence for a run seed. */
export function tileSequence(seed: string): Exclude<Tile, null>[] {
  const random = seededRandom(`${seed}:tiles`);
  const bag: Exclude<Tile, null>[] = [];
  for (let i = 0; i < PLACEMENTS; i++) {
    bag.push(TILE_TYPES[Math.floor(random() * TILE_TYPES.length)]!);
  }
  return bag;
}

export function scoreRun(total: number): number {
  return Math.max(0, Math.min(100, Math.round((total / TARGET_SCORE) * 100)));
}
