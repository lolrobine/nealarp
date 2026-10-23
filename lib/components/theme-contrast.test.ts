import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The palette is the one piece of styling that can silently fail an
 * accessibility bar: a colour tweak that looks fine on the author's monitor
 * can drop body text below the WCAG AA threshold everywhere at once. These
 * ratios are computed from globals.css itself, so the test fails if a token
 * is edited without checking what it does to legibility.
 */
const CSS = readFileSync(join(__dirname, "..", "..", "app", "globals.css"), "utf8");

function token(name: string, scope: "root" | "dark"): string {
  const block =
    scope === "root" ? CSS.slice(CSS.indexOf(":root")) : CSS.slice(CSS.indexOf(".dark"));
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --${name} not found in ${scope}`);
  return match[1]!;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("palette contrast", () => {
  const cases: [string, "root" | "dark", string, string][] = [
    ["body text on the page", "root", "foreground", "background"],
    ["body text on a card", "root", "foreground", "card"],
    ["secondary text on the page", "root", "muted-foreground", "background"],
    ["secondary text on a card", "root", "muted-foreground", "card"],
    ["secondary text on an inset", "root", "muted-foreground", "secondary"],
    ["button label on primary", "root", "primary-foreground", "primary"],
    ["body text on the page", "dark", "foreground", "background"],
    ["body text on a card", "dark", "foreground", "card"],
    ["secondary text on a card", "dark", "muted-foreground", "card"],
    ["secondary text on an inset", "dark", "muted-foreground", "secondary"],
    ["button label on primary", "dark", "primary-foreground", "primary"],
  ];

  for (const [what, scope, fg, bg] of cases) {
    it(`${what} (${scope}) clears WCAG AA for normal text`, () => {
      expect(contrast(token(fg, scope), token(bg, scope))).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("the focus ring is distinguishable from both page backgrounds", () => {
    expect(contrast(token("ring", "root"), token("background", "root"))).toBeGreaterThanOrEqual(3);
    expect(contrast(token("ring", "dark"), token("background", "dark"))).toBeGreaterThanOrEqual(3);
  });

  it("page, card and inset are three different surfaces rather than one repeated", () => {
    for (const scope of ["root", "dark"] as const) {
      const surfaces = [
        token("background", scope),
        token("card", scope),
        token("secondary", scope),
      ];
      expect(new Set(surfaces).size, `${scope} reuses a surface colour`).toBe(3);
    }
  });
});

/**
 * The tokens above are only half the story. A screen can bypass them
 * entirely by hardcoding a Tailwind palette colour, and the mid-range
 * shades are the trap: bg-indigo-500 with white text reads as obviously
 * "primary coloured" and comes to 4.47:1, under the 4.5 AA needs. That
 * exact pair was rejected for the token palette and was still sitting in
 * Block Talk and Current Courier, which had never been looked at because
 * they do not use the token.
 *
 * Shades 300 to 500 are light enough that white text on them fails, so
 * any class string pairing the two is wrong whatever the hue. Dark shades
 * are not matched: a fixed dark scene like Deep Sea's ocean or Gravity
 * Golf's starfield is entitled to white text on bg-slate-950.
 */
describe("no screen hardcodes white text onto a light palette colour", () => {
  const GAMES = join(process.cwd(), "app/(experiences)");
  const LIGHT_BACKGROUND = /\bbg-(?:[a-z]+)-(?:300|400|500)\b/;
  /** Class strings arrive as plain or template literals; both are one line. */
  const LITERAL = /"([^"\n]*)"|`([^`\n]*)`/g;

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      if (!entry.name.endsWith(".tsx") || entry.name.includes(".test.")) return [];
      return [path];
    });
  }

  it("pairs white text only with backgrounds dark enough to carry it", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(GAMES)) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(LITERAL)) {
        const classes = match[1] ?? match[2] ?? "";
        if (!classes.includes("text-white") || !LIGHT_BACKGROUND.test(classes)) continue;
        const shade = LIGHT_BACKGROUND.exec(classes)?.[0];
        offenders.push(`${file.replace(GAMES, "")}: text-white on ${shade}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
