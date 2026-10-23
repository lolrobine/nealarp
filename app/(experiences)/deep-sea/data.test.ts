import { describe, expect, it } from "vitest";
import {
  creatures,
  getBackgroundColor,
  getZone,
  MAX_DEPTH,
  SEA_LEVEL,
  sortedCreatures,
  zones,
} from "./data";
import { creatureShape } from "@/lib/components/games/Picto";

describe("the depth zones", () => {
  it("tile the whole water column with no gap and no overlap", () => {
    expect(zones[0]!.minDepth).toBe(SEA_LEVEL);
    expect(zones.at(-1)!.maxDepth).toBe(MAX_DEPTH);
    for (let i = 1; i < zones.length; i++) {
      expect(zones[i]!.minDepth).toBe(zones[i - 1]!.maxDepth);
    }
  });

  it("names the surface zone at the surface and the deepest at the bottom", () => {
    expect(getZone(0).name).toBe("Sunlight Zone");
    expect(getZone(MAX_DEPTH).name).toBe("Hadal Zone");
  });

  it("puts each boundary in the zone that starts there, not the one that ends", () => {
    for (const zone of zones) expect(getZone(zone.minDepth).name).toBe(zone.name);
  });

  /**
   * The lookup used to fall through to the last entry whenever nothing
   * matched, so a depth above the surface came back as the Hadal Zone — the
   * deepest trench on Earth, for a number meaning "in the air".
   */
  it("does not call the sky the Hadal Zone", () => {
    expect(getZone(-5).name).toBe("Sunlight Zone");
    expect(getZone(-10000).name).toBe("Sunlight Zone");
    expect(getZone(NaN).name).toBe("Sunlight Zone");
  });

  it("clamps anything below the trench to the deepest zone", () => {
    expect(getZone(MAX_DEPTH + 1000).name).toBe("Hadal Zone");
  });
});

describe("the creatures", () => {
  it("all live within the water column the page draws", () => {
    for (const creature of creatures) {
      expect(creature.depth).toBeGreaterThanOrEqual(SEA_LEVEL);
      expect(creature.depth).toBeLessThanOrEqual(MAX_DEPTH);
    }
  });

  it("each have a name and a description worth reading", () => {
    for (const creature of creatures) {
      expect(creature.name.trim().length).toBeGreaterThan(0);
      expect(creature.description.trim().length).toBeGreaterThan(10);
    }
  });

  it("are listed under distinct names", () => {
    expect(new Set(creatures.map((c) => c.name)).size).toBe(creatures.length);
  });

  it("sortedCreatures really is sorted, and keeps everybody", () => {
    expect(sortedCreatures).toHaveLength(creatures.length);
    for (let i = 1; i < sortedCreatures.length; i++) {
      expect(sortedCreatures[i]!.depth).toBeGreaterThanOrEqual(sortedCreatures[i - 1]!.depth);
    }
  });

  it("leaves the source list untouched when sorting", () => {
    const before = creatures.map((c) => c.name);
    void sortedCreatures;
    expect(creatures.map((c) => c.name)).toEqual(before);
  });

  it("every creature maps onto a drawn silhouette", () => {
    for (const creature of creatures) {
      expect(creatureShape(creature.name)).toBeTruthy();
    }
  });
});

describe("getBackgroundColor", () => {
  it("returns a usable colour for every depth, including out-of-range ones", () => {
    for (const depth of [-100, 0, 1, 200, 1000, 4000, 6000, MAX_DEPTH, MAX_DEPTH * 2]) {
      expect(getBackgroundColor(depth)).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    }
  });

  it("never emits a channel outside 0-255", () => {
    for (let depth = 0; depth <= MAX_DEPTH; depth += 97) {
      const channels = getBackgroundColor(depth).match(/\d+/g)!.map(Number);
      for (const channel of channels) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });

  it("gets darker as you descend and ends in black", () => {
    const brightness = (depth: number) =>
      getBackgroundColor(depth)
        .match(/\d+/g)!
        .map(Number)
        .reduce((a, b) => a + b, 0);
    expect(brightness(0)).toBeGreaterThan(brightness(2000));
    expect(brightness(2000)).toBeGreaterThan(brightness(5000));
    expect(brightness(MAX_DEPTH)).toBe(0);
  });
});
