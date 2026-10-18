import { seededRandom } from "@/lib/games/daily";

/** Block Talk: one player sees a block pattern on an A1–D4 grid and describes it;
 * the partner rebuilds it. Played solo, the game becomes a memory duel — the pattern
 * flashes, then you rebuild it on the grid. Score is the overlap between the two
 * patterns (inspired by Keep Talking and Nobody Explodes' asymmetric information,
 * with original patterns and rules). */

export const COLS = ["A", "B", "C", "D"] as const;
export const ROWS = ["1", "2", "3", "4"] as const;

export type CellId = string; // "A1" .. "D4"
export type Pattern = CellId[];

export function allCells(): CellId[] {
  return COLS.flatMap((c) => ROWS.map((r) => `${c}${r}`));
}

export function generatePattern(seed: string, round: number): Pattern {
  const random = seededRandom(`${seed}:block-talk:${round}`);
  const cells = allCells();
  const size = 3 + Math.floor(random() * 4); // 3–6 blocks
  const picked = new Set<string>();
  while (picked.size < size) {
    picked.add(cells[Math.floor(random() * cells.length)]!);
  }
  return [...picked].sort();
}

export type Overlap = {
  shared: number;
  union: number;
  /** Percent of agreement (intersection over union), rounded. */
  overlapPct: number;
  missed: CellId[];
  extra: CellId[];
};

export function comparePatterns(target: Pattern, placed: Pattern): Overlap {
  const t = new Set(target);
  const p = new Set(placed);
  const shared = [...t].filter((c) => p.has(c));
  const union = new Set([...t, ...p]);
  return {
    shared: shared.length,
    union: union.size,
    overlapPct: union.size === 0 ? 100 : Math.round((shared.length / union.size) * 100),
    missed: [...t].filter((c) => !p.has(c)).sort(),
    extra: [...p].filter((c) => !t.has(c)).sort(),
  };
}

export function scoreBlockTalk(overlapPct: number): number {
  return Math.max(0, Math.min(100, overlapPct));
}
