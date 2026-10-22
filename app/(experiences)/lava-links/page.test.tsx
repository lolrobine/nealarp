import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LavaLinks from "./page";

const slab = (label: RegExp) => screen.getByRole("button", { name: label });

describe("lava-links board", () => {
  it("draws real hexagons instead of a row of circles", () => {
    const { container } = render(<LavaLinks />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas!.getAttribute("aria-hidden")).toBe("true");
  });

  it("drops the twelve direction buttons in favour of tapping the landing tile", () => {
    render(<LavaLinks />);
    expect(screen.queryByRole("button", { name: "Hop 2 tiles NW" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hop 1 tile E" })).toBeNull();
  });

  it("enables only the tiles you can legally land on", () => {
    render(<LavaLinks />);
    const live = screen
      .getAllByRole("button")
      .filter((b) => /^\d,\d /.test(b.getAttribute("aria-label") ?? ""))
      .filter((b) => !b.hasAttribute("disabled"));
    expect(live.length).toBeGreaterThan(0);
    for (const button of live) {
      expect(button.getAttribute("aria-label")).toMatch(/to land here/);
    }
  });

  it("says in the label which hop a tile would take", () => {
    render(<LavaLinks />);
    // Warm up: two tiles west of the start is a legal landing.
    expect(slab(/^3,4 slab \(hop 2 W to land here\)/)).toBeTruthy();
  });

  it("plays the level out by tapping landings", () => {
    render(<LavaLinks />);
    fireEvent.click(slab(/^3,4 slab/));
    expect(slab(/^3,4 slab you are here/)).toBeTruthy();
    fireEvent.click(slab(/^3,3 slab goal/));
    expect(screen.getByText(/Crossed in 2 moves/)).toBeTruthy();
  });

  it("crumbles the tile you leave behind", () => {
    render(<LavaLinks />);
    fireEvent.click(slab(/^3,4 slab/));
    expect(slab(/^5,4 crumbled/)).toBeTruthy();
  });

  it("takes a hop back with Undo", () => {
    render(<LavaLinks />);
    fireEvent.click(slab(/^3,4 slab/));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(slab(/^5,4 slab you are here/)).toBeTruthy();
  });
});
