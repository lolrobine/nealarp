import { readFileSync } from "node:fs";
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
