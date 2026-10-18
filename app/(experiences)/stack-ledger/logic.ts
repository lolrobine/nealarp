import { seededRandom } from "@/lib/games/daily";

/** Stack falling bars into a level tower. The full width queue is visible from the
 * start, so nothing depends on luck: you can plan the skyline. A bar lands as a
 * rigid body on the tallest column in its span; parts overhanging lower columns
 * snap off and tumble away. Reach WIN_HEIGHT to close the ledger. */

export type StackState = {
  heights: number[]; // one entry per column
  queue: number[]; // full deterministic width sequence — always visible
  cursor: number; // index of the moving bar in the queue
  x: number; // left column of the moving bar
  tick: number; // movement clock
  phase: "moving" | "gameover" | "won";
  dropped: number;
  kept: number; // bar cells that landed and stayed
  lost: number; // bar cells snapped off as overhang
};

export const COLS = 11;
export const WIN_HEIGHT = 20;
export const QUEUE_VISIBLE = 6;
/** Width pool cycled (and seeded-shuffled) into the queue. */
export const WIDTH_POOL = [2, 3, 3, 4, 4, 5];

/** The full width sequence for a run — deterministic, and shown to the player. */
export function makeQueue(seed: string, length = 200): number[] {
  const random = seededRandom(`${seed}:widths`);
  const queue: number[] = [];
  while (queue.length < length) {
    const round = [...WIDTH_POOL];
    for (let i = round.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [round[i], round[j]] = [round[j]!, round[i]!];
    }
    queue.push(...round);
  }
  return queue.slice(0, length);
}

export function newRun(seed: string): StackState {
  return {
    heights: Array<number>(COLS).fill(0),
    queue: makeQueue(seed),
    cursor: 0,
    x: 0,
    tick: 0,
    phase: "moving",
    dropped: 0,
    kept: 0,
    lost: 0,
  };
}

export function barWidth(state: StackState): number {
  return state.queue[state.cursor] ?? 2;
}

/** Auto-slide: the bar glides back and forth across the whole field. */
export function slideX(tick: number, width: number): number {
  const span = COLS - width;
  if (span <= 0) return 0;
  const period = 2 * span;
  const pos = tick % period;
  return pos <= span ? pos : period - pos;
}

export function step(state: StackState, ticks: number): StackState {
  if (state.phase !== "moving") return state;
  const tick = state.tick + ticks;
  return { ...state, tick, x: slideX(tick, barWidth(state)) };
}

export function nudge(state: StackState, dir: -1 | 1): StackState {
  if (state.phase !== "moving") return state;
  const x = Math.max(0, Math.min(COLS - barWidth(state), state.x + dir));
  return { ...state, x };
}

/** Where a bar at column x lands: rigid body resting on the tallest column of its
 * span. Returns the contact height and which cells are supported at that height. */
export function landing(
  heights: number[],
  x: number,
  width: number
): { contact: number; supported: boolean[] } {
  let contact = 0;
  for (let i = 0; i < width; i++) contact = Math.max(contact, heights[x + i] ?? 0);
  const supported = Array.from({ length: width }, (_, i) => heights[x + i] === contact);
  return { contact, supported };
}

export function dropBlock(state: StackState): StackState {
  if (state.phase !== "moving") return state;
  const width = barWidth(state);
  const x = state.x;
  const { supported } = landing(state.heights, x, width);
  const heights = [...state.heights];
  let kept = 0;
  let lost = 0;
  for (let i = 0; i < width; i++) {
    if (supported[i]) {
      heights[x + i] = heights[x + i]! + 1;
      kept++;
    } else {
      lost++;
    }
  }
  const cursor = state.cursor + 1;
  const dropped = state.dropped + 1;
  const maxH = Math.max(...heights);
  return {
    ...state,
    heights,
    cursor,
    x: 0,
    tick: 0,
    dropped,
    kept: state.kept + kept,
    lost: state.lost + lost,
    phase: maxH >= WIN_HEIGHT ? "won" : "moving",
  };
}

/** Score 0–100: how high the tower has grown. */
export function scoreTower(heights: number[]): number {
  return Math.min(100, 5 * Math.max(0, ...heights));
}

/** Efficiency of the ledger so far: kept share of all dropped cells (0..1). */
export function efficiency(state: StackState): number {
  const total = state.kept + state.lost;
  return total === 0 ? 1 : state.kept / total;
}

/** Upcoming widths, for the always-visible queue. */
export function upcoming(state: StackState, count = QUEUE_VISIBLE): number[] {
  return state.queue.slice(state.cursor + 1, state.cursor + 1 + count);
}

/** A scripted perfect run keeps every cell: land each bar fully supported. */
export function perfectPlay(seed: string, drops: number): StackState {
  let state = newRun(seed);
  for (let d = 0; d < drops && state.phase === "moving"; d++) {
    const width = barWidth(state);
    // Choose the flattest span: the one with the smallest height spread.
    let bestX = 0;
    let bestSpread = Infinity;
    for (let x = 0; x <= COLS - width; x++) {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < width; i++) {
        lo = Math.min(lo, state.heights[x + i]!);
        hi = Math.max(hi, state.heights[x + i]!);
      }
      const spread = hi - lo;
      if (spread < bestSpread) {
        bestSpread = spread;
        bestX = x;
      }
    }
    state = dropBlock({ ...state, x: bestX });
  }
  return state;
}
