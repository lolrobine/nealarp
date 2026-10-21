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
});
