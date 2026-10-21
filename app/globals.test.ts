import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

/** Pulls the body of a top-level `@layer <name> { ... }` block. */
function layerBody(name: string): string {
  const start = css.indexOf(`@layer ${name} {`);
  if (start === -1) return "";
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(start, i);
  }
  return "";
}

describe("globals.css promises the components rely on", () => {
  it("keeps .board inside @layer components so bg utilities still win", () => {
    // stack-ledger pairs `board` with `bg-sky-100/50`. Unlayered CSS outranks
    // Tailwind utilities, which would silently paint over that background.
    expect(layerBody("components")).toContain(".board");
  });

  it("collapses both animations and transitions for reduced motion", () => {
    const start = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, start + 400);
    expect(block).toContain("animation-duration");
    expect(block).toContain("transition-duration");
  });

  it("keeps native checkboxes at or above the 24px touch target", () => {
    const start = css.indexOf('input[type="checkbox"] {');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf("}", start));
    const size = /width:\s*([\d.]+)rem/.exec(block);
    expect(size).not.toBeNull();
    expect(Number(size![1])).toBeGreaterThanOrEqual(1.5);
  });

  it("defines the score meter the personal-best card renders", () => {
    expect(css).toContain(".score-meter");
    expect(css).toContain(".score-meter-fill");
  });
});
