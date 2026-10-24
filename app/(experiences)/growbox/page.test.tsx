import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import GrowboxPage from "./page";
import { ITEMS, MAX_LEVEL, PERFECT_TOTAL, type ItemId } from "./logic";

/** The order the logic tests prove reaches every level. */
const PERFECT_ORDER: ItemId[] = [
  "soil",
  "seeds",
  "water",
  "light",
  "warmth",
  "bees",
  "shelf",
  "vent",
];

const nameOf = (id: ItemId) => ITEMS.find((item) => item.id === id)!.name;

function place(id: ItemId) {
  fireEvent.click(screen.getByRole("button", { name: `Place ${nameOf(id)}. ${blurbOf(id)}` }));
}

const blurbOf = (id: ItemId) => ITEMS.find((item) => item.id === id)!.blurb;

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("placing upgrades", () => {
  it("counts a placement and names what it did in the log", () => {
    render(<GrowboxPage />);
    expect(screen.getByText(`Total levels: 0 / ${PERFECT_TOTAL}`)).toBeTruthy();
    expect(screen.getByText(/Nothing yet/)).toBeTruthy();

    place("soil");

    expect(screen.getByText(`Total levels: 1 / ${PERFECT_TOTAL}`)).toBeTruthy();
    expect(screen.getByText("Placed Soil.")).toBeTruthy();
  });

  it("tells a screen reader the level a placed upgrade reached", () => {
    // The label used to end at "(already placed)", which replaced the visible
    // "Lv 2" badge with nothing - and the level is the whole game.
    render(<GrowboxPage />);
    place("soil");
    expect(
      screen.getByRole("button", { name: `Soil, placed, level 1 of ${MAX_LEVEL}` })
    ).toBeTruthy();

    place("water");

    expect(
      screen.getByRole("button", { name: `Soil, placed, level 2 of ${MAX_LEVEL}` })
    ).toBeTruthy();
  });

  it("will not let the same upgrade be placed twice", () => {
    render(<GrowboxPage />);
    place("soil");
    const button = screen.getByRole("button", {
      name: `Soil, placed, level 1 of ${MAX_LEVEL}`,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

describe("finishing the greenhouse", () => {
  it("reaches a hundred on the order the logic tests prove", () => {
    render(<GrowboxPage />);
    for (const id of PERFECT_ORDER) place(id);

    expect(screen.getByText("Perfect greenhouse!")).toBeTruthy();
    expect(
      screen.getByText(
        `Final score: 100 / 100 · ${PERFECT_TOTAL} of ${PERFECT_TOTAL} levels grown.`
      )
    ).toBeTruthy();
    expect(localStorage.getItem("nealarp:best:v1:growbox")).toBe("100");
  });

  it("reports a whole number, not a decimal that is always zero", () => {
    render(<GrowboxPage />);
    for (const id of [...PERFECT_ORDER].reverse()) place(id);
    expect(screen.queryByText(/Final score: \d+\.\d/)).toBeNull();
    expect(screen.getByText(/Final score: \d+ \/ 100/)).toBeTruthy();
  });

  it("scores a careless order lower than the perfect one", () => {
    render(<GrowboxPage />);
    for (const id of [...PERFECT_ORDER].reverse()) place(id);
    const best = Number(localStorage.getItem("nealarp:best:v1:growbox"));
    expect(best).toBeGreaterThan(0);
    expect(best).toBeLessThan(100);
  });

  it("puts everything back when the greenhouse is restarted", () => {
    render(<GrowboxPage />);
    for (const id of PERFECT_ORDER) place(id);
    fireEvent.click(screen.getByRole("button", { name: "Grow again" }));

    expect(screen.getByText(`Total levels: 0 / ${PERFECT_TOTAL}`)).toBeTruthy();
    expect(screen.getByText(/Nothing yet/)).toBeTruthy();
  });

  it("brings a half-finished greenhouse back after a reload", () => {
    const first = render(<GrowboxPage />);
    place("soil");
    place("water");
    first.unmount();

    render(<GrowboxPage />);
    expect(screen.getByText(`Total levels: 3 / ${PERFECT_TOTAL}`)).toBeTruthy();
  });
});
