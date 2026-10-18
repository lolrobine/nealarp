import { seededRandom } from "@/lib/games/daily";

/** Drop swinging blocks onto a tower. Every block carries a number: a block may only
 * be stacked on a block whose number is greater or equal ("N ≤ top"). Land too far
 * off-centre and the tower topples. */

export type Block = { x: number; n: number };
export type StackState = {
  placed: Block[];
  nextN: number;
  alive: boolean;
  tick: number;
  seed: string;
  dropped: number;
};

export const BLOCK_W = 0.26;
export const TOPPLE_TOLERANCE = 0.2;
export const SWING_AMPLITUDE = 0.32;
export const SWING_SPEED = 0.018;
export const WIN_HEIGHT = 20;

/** Deterministic pendulum position (0..1) for a given simulation tick. */
export function swingX(tick: number): number {
  return 0.5 + SWING_AMPLITUDE * Math.sin(tick * SWING_SPEED);
}

function nextNumber(seed: string, dropped: number): number {
  const random = seededRandom(`${seed}:block:${dropped}`);
  return 1 + Math.floor(random() * 6);
}

export function newRun(seed: string): StackState {
  return {
    placed: [],
    nextN: nextNumber(seed, 0),
    alive: true,
    tick: 0,
    seed,
    dropped: 0,
  };
}

export function step(state: StackState, ticks: number): StackState {
  return { ...state, tick: state.tick + ticks };
}

export function canDrop(state: StackState): { ok: boolean; reason: string } {
  if (!state.alive) return { ok: false, reason: "The tower has fallen." };
  const top = state.placed[state.placed.length - 1];
  if (top && state.nextN > top.n) {
    return { ok: false, reason: `Block ${state.nextN} may only rest on ${state.nextN} or higher.` };
  }
  return { ok: true, reason: "" };
}

export function dropBlock(state: StackState): StackState {
  const gate = canDrop(state);
  if (!gate.ok) return state;
  const x = swingX(state.tick);
  const top = state.placed[state.placed.length - 1];
  const offset = top ? Math.abs(x - top.x) : 0;
  const placed = [...state.placed, { x, n: state.nextN }];
  const dropped = state.dropped + 1;
  const alive = top ? offset <= TOPPLE_TOLERANCE : true;
  return {
    placed: alive ? placed : state.placed,
    nextN: nextNumber(state.seed, dropped),
    alive,
    tick: state.tick,
    seed: state.seed,
    dropped,
  };
}

export function scoreTower(height: number): number {
  return Math.max(0, Math.min(100, height * Math.floor(100 / WIN_HEIGHT)));
}
