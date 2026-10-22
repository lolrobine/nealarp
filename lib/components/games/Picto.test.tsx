import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { creatureShape, Picto, type PictoName } from "./Picto";

describe("Picto", () => {
  it("draws a glyph that inherits the surrounding text colour", () => {
    const { container } = render(<Picto name="check" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toBeTruthy();
    expect(svg.innerHTML).toContain("currentColor");
  });

  it("stays out of the accessibility tree, because the label beside it carries the meaning", () => {
    const { container } = render(<Picto name="trophy" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
  });

  it("scales from the one size prop so it can sit in a 10px bar or a 52px card", () => {
    const { container } = render(<Picto name="fish" size={52} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("52");
    expect(svg.getAttribute("height")).toBe("52");
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
  });

  it("renders every declared name without an empty body", () => {
    const names: PictoName[] = [
      "check",
      "cross",
      "bulb",
      "copy",
      "share",
      "image",
      "timer",
      "trophy",
      "sound-on",
      "sound-off",
      "rocket",
      "pause",
      "flag",
      "globe",
      "moon",
      "search",
      "map",
      "asteroid",
      "ocean",
      "desert",
      "rural",
      "suburb",
      "city",
      "megacity",
      "animals",
      "vehicles",
      "tech",
      "nature",
      "heart",
      "lungs",
      "eye",
      "bed",
      "footprint",
      "meal",
      "orbit",
      "sunrise",
      "speech",
      "smile",
      "scissors",
      "droplet",
      "galaxy",
      "planet",
      "refresh",
      "sprout",
      "fish",
      "shark",
      "cephalopod",
      "turtle",
      "dolphin",
      "worm",
      "jelly",
      "crustacean",
    ];
    for (const name of names) {
      const { container } = render(<Picto name={name} />);
      const svg = container.querySelector("svg")!;
      expect(svg.innerHTML.length, `${name} renders nothing`).toBeGreaterThan(20);
    }
  });
});

describe("creatureShape", () => {
  it("groups the deep-sea cast by body plan rather than by species", () => {
    expect(creatureShape("Great White Shark")).toBe("shark");
    expect(creatureShape("Goblin Shark")).toBe("shark");
    expect(creatureShape("Giant Squid")).toBe("cephalopod");
    expect(creatureShape("Dumbo Octopus")).toBe("cephalopod");
    expect(creatureShape("Sea Turtle")).toBe("turtle");
    expect(creatureShape("Dolphin")).toBe("dolphin");
    expect(creatureShape("Giant Tube Worm")).toBe("worm");
    expect(creatureShape("Sea Cucumber")).toBe("worm");
  });

  it("is case-insensitive, because one creature is spelled in caps", () => {
    expect(creatureShape("BLOBFISH")).toBe("fish");
  });

  it("falls back to a fish rather than throwing on an unknown name", () => {
    expect(creatureShape("Something Nobody Catalogued")).toBe("fish");
  });
});

/**
 * The six games below were converted away from emoji. Emoji render differently
 * on every platform, several vanish in monochrome, and screen readers announce
 * names nobody picked. This test fails if one creeps back in.
 *
 * perfect-circle and spend-money keep their playful emoji on purpose, and the
 * password game's "your password must contain a party popper" rule is the
 * puzzle itself, so none of them are checked here.
 */
describe("the converted games stay emoji-free", () => {
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  const ROOT = join(__dirname, "..", "..", "..", "app", "(experiences)");
  const FILES = [
    "asteroid-launcher/page.tsx",
    "asteroid-launcher/WorldMap.tsx",
    "deep-sea/page.tsx",
    "deep-sea/CreatureCard.tsx",
    "deep-sea/data.ts",
    "life-stats/page.tsx",
    "life-stats/calculator.ts",
    "password-game/page.tsx",
    "size-of-space/page.tsx",
    "size-of-space/data.ts",
    "speed/page.tsx",
    "speed/data.ts",
  ];

  for (const file of FILES) {
    it(`${file} has no emoji left`, () => {
      const offenders = readFileSync(join(ROOT, file), "utf8")
        .split("\n")
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => EMOJI.test(line));
      expect(offenders.map((o) => `${o.n}: ${o.line.trim()}`)).toEqual([]);
    });
  }
});
