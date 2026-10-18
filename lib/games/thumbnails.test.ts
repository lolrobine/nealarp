import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getLiveExperiences } from "@/lib/registry/experiences";

describe("local catalogue covers", () => {
  it("provides a unique realistic cover for all thirty-eight experiences", () => {
    const experiences = getLiveExperiences();
    expect(experiences).toHaveLength(38);
    const paths = new Set<string>();
    for (const experience of experiences) {
      const base = `/experiences/${experience.id}/`;
      expect(experience.thumbnail).toBe(`${base}realistic.webp`);
      const path = join(process.cwd(), "public", experience.thumbnail);
      expect(existsSync(path)).toBe(true);
      const data = readFileSync(path);
      expect(data.subarray(0, 4).toString()).toBe("RIFF");
      expect(data.subarray(8, 12).toString()).toBe("WEBP");
      expect(data.length).toBeLessThan(250_000);
      expect(existsSync(join(process.cwd(), "public", `${base}realistic.jpg`))).toBe(true);
      const svg = readFileSync(join(process.cwd(), "public", `${base}cover.svg`), "utf8");
      expect(svg).toContain('viewBox="0 0 960 540"');
      expect(
        new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror")
      ).toBeNull();
      expect(svg).toContain(`<title>${experience.title}</title>`);
      expect(svg).not.toMatch(/<script|(?:href|src)=["']https?:|<image\s/);
      paths.add(experience.thumbnail);
    }
    expect(paths.size).toBe(38);
  });
});
