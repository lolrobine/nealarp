import { cleanup, render } from "@testing-library/react";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "app/(experiences)");
const SLUGS = readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "_template")
  .map((entry) => entry.name)
  .sort();

afterEach(cleanup);

describe("every experience page mounts", () => {
  it("found the whole catalogue", () => {
    expect(SLUGS.length).toBe(38);
  });

  it.each(SLUGS)("%s renders without throwing", async (slug) => {
    const mod = await import(`../../app/(experiences)/${slug}/page.tsx`);
    const Page = mod.default;
    expect(Page, `${slug} has no default export`).toBeTypeOf("function");
    expect(() => render(<Page />)).not.toThrow();
  });

  /**
   * Icon-only buttons are the easy way to lose an accessible name: swap a text
   * glyph for a drawn one and the button goes silent for anyone using a screen
   * reader, with nothing visibly wrong. This catches that across the catalogue
   * rather than one page at a time.
   */
  it.each(SLUGS)("%s gives every button an accessible name", async (slug) => {
    const mod = await import(`../../app/(experiences)/${slug}/page.tsx`);
    const { container } = render(<mod.default />);
    const nameless = Array.from(container.querySelectorAll("button"))
      .filter((button) => {
        const name =
          button.getAttribute("aria-label") ??
          button.getAttribute("title") ??
          button.textContent ??
          "";
        return name.trim() === "" && !button.hasAttribute("aria-labelledby");
      })
      .map((button) => button.outerHTML.slice(0, 120));
    expect(nameless).toEqual([]);
  });
});
