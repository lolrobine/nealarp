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

  /**
   * The same hole exists for everything else a player can operate. Size of
   * Space had two range inputs whose labels sat beside them as plain text with
   * no htmlFor, so its zoom and pan sliders announced themselves as nothing at
   * all. A visible label is not an accessible name unless it is attached.
   */
  it.each(SLUGS)("%s names every other control too", async (slug) => {
    const mod = await import(`../../app/(experiences)/${slug}/page.tsx`);
    const { container } = render(<mod.default />);
    const selector = [
      "a[href]",
      'input:not([type="hidden"])',
      "select",
      "textarea",
      '[role="button"]',
      '[role="slider"]',
      '[role="checkbox"]',
    ].join(", ");
    const nameless = Array.from(container.querySelectorAll(selector))
      .filter((el) => accessibleName(el, container) === "")
      .map((el) => el.outerHTML.slice(0, 120));
    expect(nameless).toEqual([]);
  });
});

/** Rough accessible-name lookup: enough to tell "named" from "silent". */
function accessibleName(el: Element, root: ParentNode): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => root.querySelector(`#${CSS.escape(id)}`)?.textContent ?? "")
      .join(" ")
      .trim();
  }
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();
  const id = el.getAttribute("id");
  if (id) {
    const attached = root.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (attached?.textContent?.trim()) return attached.textContent.trim();
  }
  const wrapping = el.closest("label");
  if (wrapping?.textContent?.trim()) return wrapping.textContent.trim();
  for (const attr of ["title", "placeholder", "alt"]) {
    const value = el.getAttribute(attr);
    if (value?.trim()) return value.trim();
  }
  return (el.textContent ?? "").trim();
}
