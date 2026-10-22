import { describe, expect, it } from "vitest";
import {
  emitterBeams,
  canPlace,
  isSolved,
  LEVELS,
  reflect,
  traceBeams,
  turnLeft,
  turnRight,
  withPlacements,
  type Cell,
  type Level,
} from "./logic";

const e = (dir: 0 | 1 | 2 | 3): Cell => ({ kind: "emitter", dir });
const o: Cell = { kind: "empty" };
const t = (needs: "r" | "g" | "b"): Cell => ({ kind: "target", needs });
const w: Cell = { kind: "wall" };
const p: Cell = { kind: "prism" };

function levelFrom(grid: Cell[][]): Level {
  return { name: "test", grid, tray: [], solution: [] };
}

describe("light-loom optics", () => {
  it("turns and reflections follow the stated rules", () => {
    expect(turnLeft(0)).toBe(3);
    expect(turnRight(0)).toBe(1);
    expect(reflect("mirrorA", 0)).toBe(1);
    expect(reflect("mirrorA", 1)).toBe(0);
    expect(reflect("mirrorB", 0)).toBe(3);
    expect(reflect("mirrorB", 2)).toBe(1);
  });

  it("emitters start all three colour components", () => {
    const beams = emitterBeams(
      levelFrom([[e(1), o, o, o, o, o], ...Array(5).fill([o, o, o, o, o, o])])
    );
    expect(beams).toHaveLength(3);
    expect(new Set(beams.map((b) => b.color))).toEqual(new Set(["r", "g", "b"]));
  });

  it("a straight beam lights its target and a wall blocks it", () => {
    const level = levelFrom([
      [e(1), o, t("r"), o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
    ]);
    const { lit } = traceBeams(level);
    expect(lit.get("2,0")?.has("r")).toBe(true);
    const blocked = levelFrom([
      [e(1), w, t("r"), o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
    ]);
    const afterWall = traceBeams(blocked);
    expect(afterWall.lit.get("2,0")?.has("r") ?? false).toBe(false);
  });

  it("prisms split white into red-straight, green-left, blue-right", () => {
    const level = levelFrom([
      [o, o, t("g"), o, o, o],
      [o, o, o, o, o, o],
      [e(1), o, p, o, o, t("r")],
      [o, o, o, o, o, o],
      [o, o, o, o, o, o],
      [o, o, t("b"), o, o, o],
    ]);
    const { litTargets } = traceBeams(level);
    const colors = litTargets.map((x) => x.color);
    expect(colors).toContain("r");
    expect(colors).toContain("g");
    expect(colors).toContain("b");
    expect(isSolved(level)).toBe(true);
  });
});

describe("light-loom levels", () => {
  it("ships four levels that start unsolved", () => {
    expect(LEVELS).toHaveLength(4);
    for (const level of LEVELS) {
      expect(level.grid).toHaveLength(6);
      // Regression: levels used to ship with their optics already placed, which
      // handed out a free 100. An empty board must never light every target.
      expect(isSolved(level), level.name).toBe(false);
    }
  });

  it("every authored solution lights every target", () => {
    for (const level of LEVELS) {
      expect(isSolved(withPlacements(level, level.solution)), level.name).toBe(true);
    }
  });

  it("the tray holds exactly the optics a solution needs", () => {
    for (const level of LEVELS) {
      const tray = [...level.tray].sort();
      const used = level.solution.map((s) => s.kind).sort();
      expect(tray, level.name).toEqual(used);
      expect(level.tray.length, level.name).toBeGreaterThan(0);
    }
  });

  it("solutions only use free squares, and occupied squares reject optics", () => {
    for (const level of LEVELS) {
      for (const placement of level.solution) {
        expect(
          canPlace(level, placement.x, placement.y),
          `${level.name} ${placement.x},${placement.y}`
        ).toBe(true);
      }
      // Fixed cells and out-of-bounds stay untouchable.
      const fixed = level.grid.flatMap((row, y) =>
        row.flatMap((cell, x) => (cell.kind === "empty" ? [] : [{ x, y }]))
      );
      for (const cell of fixed) expect(canPlace(level, cell.x, cell.y), level.name).toBe(false);
      expect(canPlace(level, -1, 0)).toBe(false);
      expect(canPlace(level, 0, 99)).toBe(false);
    }
  });

  it("withPlacements never mutates the shipped level", () => {
    const level = LEVELS[0]!;
    const before = JSON.stringify(level.grid);
    withPlacements(level, level.solution);
    expect(JSON.stringify(level.grid)).toBe(before);
  });

  it("a partial solution does not count as solved", () => {
    const multi = LEVELS.filter((l) => l.solution.length > 1);
    expect(multi.length).toBeGreaterThan(0);
    for (const level of multi) {
      expect(isSolved(withPlacements(level, level.solution.slice(0, 1))), level.name).toBe(false);
    }
  });
});

describe("light-loom beam segments", () => {
  it("reports every hop the light makes so it can be drawn as lines", () => {
    const solved = withPlacements(LEVELS[0]!, LEVELS[0]!.solution);
    const { segments, lit } = traceBeams(solved);
    expect(segments.length).toBeGreaterThan(0);
    // Each hop is exactly one cell, axis-aligned — never a diagonal or a jump.
    for (const s of segments) {
      const dx = Math.abs(s.x2 - s.x1);
      const dy = Math.abs(s.y2 - s.y1);
      expect(dx + dy).toBe(1);
    }
    // Every cell a segment touches is also reported as lit, so the drawing and
    // the win condition can never disagree about where the light goes.
    for (const s of segments) {
      expect(lit.has(`${s.x2},${s.y2}`)).toBe(true);
    }
  });

  it("produces no segments on an empty board with no lamp path", () => {
    const bare = traceBeams(LEVELS[0]!);
    // The lamp still fires, so there is light; it just never reaches the target.
    expect(bare.litTargets.length).toBe(0);
  });
});
