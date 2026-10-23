import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import DeepSea from "./page";
import { sortedCreatures } from "./data";

/**
 * jsdom reports a scrollHeight of 0, so the page's own arithmetic collapses the whole water
 * column into a single pixel of scrolling. That is exactly the case worth testing: one scroll
 * event carries the diver from the surface to the trench with nothing sampled in between,
 * which is what a flick, the End key, a zone button or the depth slider really do.
 */
function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

/** The depth readout is also an aria-live region, so find this one by its own caption. */
const counter = (container: HTMLElement) => {
  const caption = Array.from(container.querySelectorAll("div")).find(
    (node) => node.textContent?.trim() === "Creatures Found"
  );
  return caption?.parentElement
    ?.querySelector("[aria-live]")
    ?.textContent?.replace(/\s+/g, " ")
    .trim();
};

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

describe("deep-sea dive", () => {
  it("starts at the surface with the shallow creatures only", async () => {
    const { container } = render(<DeepSea />);
    await waitFor(() => expect(counter(container)).toBeTruthy());
    const found = Number(counter(container)!.split("/")[0]!.trim());
    expect(found).toBeLessThan(sortedCreatures.length);
  });

  /**
   * The bug: discovery compared the creature's depth against wherever that frame happened to
   * sample, inside a 150 m band. Anything the dive skipped over was never counted, and the
   * counter could only be repaired by crawling back up through each band one at a time.
   */
  it("counts everything the dive passed, even when it passed it in one jump", async () => {
    const { container } = render(<DeepSea />);
    await waitFor(() => expect(counter(container)).toBeTruthy());

    scrollTo(1); // straight to the bottom of the column

    await waitFor(() =>
      expect(counter(container)).toBe(`${sortedCreatures.length} / ${sortedCreatures.length}`)
    );
  });

  it("does not take discoveries away again on the way back up", async () => {
    const { container } = render(<DeepSea />);
    await waitFor(() => expect(counter(container)).toBeTruthy());

    scrollTo(1);
    await waitFor(() =>
      expect(counter(container)).toBe(`${sortedCreatures.length} / ${sortedCreatures.length}`)
    );

    scrollTo(0);
    await waitFor(() =>
      expect(counter(container)).toBe(`${sortedCreatures.length} / ${sortedCreatures.length}`)
    );
  });

  it("says whether a creature has been found, not just which colour its dot is", async () => {
    const { container } = render(<DeepSea />);
    await waitFor(() => expect(counter(container)).toBeTruthy());

    const dots = () =>
      Array.from(container.querySelectorAll("[title]"))
        .map((el) => el.getAttribute("title") ?? "")
        .filter((title) => title.includes("@"));

    expect(dots().length).toBe(sortedCreatures.length);
    expect(dots().some((title) => title.includes("not found yet"))).toBe(true);

    scrollTo(1);
    await waitFor(() => expect(dots().every((title) => title.endsWith("found"))).toBe(true));
  });
});
