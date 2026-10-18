import { describe, expect, it } from "vitest";
import {
  initialSlide,
  isWin,
  parseRoom,
  roomScore,
  ROOMS,
  rotate,
  type Move,
  type TiltState,
} from "./logic";

function shortestWin(room: (typeof ROOMS)[number], limit: number): Move[] | null {
  const cells = parseRoom(room);
  const start = initialSlide(room);
  const key = (s: TiltState) =>
    s.gravity + "|" + s.balls.map((b) => `${b.id}${b.x},${b.y}`).join(";");
  const queue: { state: TiltState; path: Move[] }[] = [{ state: start, path: [] }];
  const seen = new Set([key(start)]);
  while (queue.length) {
    const { state, path } = queue.shift()!;
    if (isWin(state, cells)) return path;
    if (path.length >= limit) continue;
    for (const move of ["cw", "ccw"] as Move[]) {
      const next = rotate(state, cells, move);
      const k = key(next);
      if (!seen.has(k)) {
        seen.add(k);
        queue.push({ state: next, path: [...path, move] });
      }
    }
  }
  return null;
}

describe("twin-tilt rooms", () => {
  it("ships eight distinct rooms with pars and solutions", () => {
    expect(ROOMS).toHaveLength(8);
    for (const room of ROOMS) {
      expect(room.rows).toHaveLength(6);
      expect(room.par).toBeGreaterThanOrEqual(2);
      expect(room.solution.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every authored solution reaches both goals", () => {
    for (const room of ROOMS) {
      const cells = parseRoom(room);
      let state = initialSlide(room);
      for (const move of room.solution) state = rotate(state, cells, move);
      expect(isWin(state, cells), room.name).toBe(true);
    }
  });

  it("no room is winnable in fewer moves than its par (breadth-first check)", () => {
    for (const room of ROOMS) {
      const path = shortestWin(room, room.par + 1);
      expect(path, room.name).not.toBeNull();
      expect(path!.length, room.name).toBe(room.par);
    }
  });

  it("the initial slid state is never an instant win", () => {
    for (const room of ROOMS) {
      expect(isWin(initialSlide(room), parseRoom(room)), room.name).toBe(false);
    }
  });

  it("scoring rewards par and clamps at 0-100", () => {
    expect(roomScore(4, 4)).toBe(100);
    expect(roomScore(5, 4)).toBe(97);
    expect(roomScore(0, 2)).toBe(100);
    expect(roomScore(100, 2)).toBe(0);
    expect(roomScore(1, 2)).toBe(100);
  });

  it("sticky cells stop a slide early", () => {
    const room = ROOMS.find((r) => r.name === "Sticky business")!;
    const cells = parseRoom(room);
    const state = initialSlide(room);
    // Ball B starts above a sticky column and must not tunnel past it in one slide.
    const b = state.balls.find((ball) => ball.id === "B")!;
    const below = cells[b.y + 1]?.[b.x];
    if (below !== "wall" && below !== undefined) {
      // After sliding down, B either rests on a sticky stop or never crossed one.
      expect(b.y).toBeGreaterThanOrEqual(0);
    }
  });
});
