import { describe, expect, it } from "vitest";
import {
  emitterBeams,
  isSolved,
  LEVELS,
  reflect,
  traceBeams,
  turnLeft,
  turnRight,
  type Cell,
  type Level,
} from "./logic";

const e = (dir: 0 | 1 | 2 | 3): Cell => ({ kind: "emitter", dir });
const o: Cell = { kind: "empty" };
const t = (needs: "r" | "g" | "b"): Cell => ({ kind: "target", needs });
const w: Cell = { kind: "wall" };
const p: Cell = { kind: "prism" };

function levelFrom(grid: Cell[][]): Level {
  return { name: "test", grid };
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
  it("ships four solvable levels", () => {
    expect(LEVELS).toHaveLength(4);
    for (const level of LEVELS) {
      expect(level.grid).toHaveLength(6);
      expect(isSolved(level), level.name).toBe(true);
    }
  });
});
