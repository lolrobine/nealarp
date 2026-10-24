import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PocketAlchemistPage from "./page";
import { discoveryScore, INGREDIENTS, mix } from "./logic";

const ing = (id: string) => INGREDIENTS.find((i) => i.id === id)!;
const btn = (name: string) => screen.getByRole("button", { name });
const pick = (id: string) => fireEvent.click(btn(ing(id).name));
const best = () => localStorage.getItem("nealarp:best:v1:pocket-alchemist");

/** Mix two ingredients and bottle whatever comes out. */
function bottle(a: string, b: string) {
  pick(a);
  pick(b);
  fireEvent.click(screen.getByRole("button", { name: /Bottle it|Continue/ }));
}

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("picking ingredients", () => {
  it("shows the result of the pair the logic would produce", () => {
    render(<PocketAlchemistPage />);
    pick("water");
    pick("fire");
    const expected = mix(ing("water"), ing("fire"));
    expect(screen.getByText(`New discovery: ${expected.name}`)).toBeTruthy();
    expect(screen.getByText(expected.blurb)).toBeTruthy();
  });

  it("lets a chosen ingredient be put back, as aria-pressed promises", () => {
    render(<PocketAlchemistPage />);
    pick("water");
    expect(btn("Water").getAttribute("aria-pressed")).toBe("true");

    pick("water");
    expect(btn("Water").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText(/Pick your first ingredient/)).toBeTruthy();
  });

  it("drops only the second ingredient when the second is put back", () => {
    render(<PocketAlchemistPage />);
    pick("water");
    pick("fire");
    pick("fire");

    expect(btn("Water").getAttribute("aria-pressed")).toBe("true");
    expect(btn("Fire").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText(/Mixing Water/)).toBeTruthy();
  });

  it("slides the second ingredient up when the first is put back", () => {
    render(<PocketAlchemistPage />);
    pick("water");
    pick("fire");
    pick("water");

    expect(screen.getByText(/Mixing Fire/)).toBeTruthy();
    expect(btn("Fire").getAttribute("aria-pressed")).toBe("true");
  });
});

describe("the shelf", () => {
  it("counts a bottled concept once, however often it is re-mixed", () => {
    render(<PocketAlchemistPage />);
    bottle("water", "fire");
    expect(screen.getByText(/Shelf \(1 bottled\)/)).toBeTruthy();

    pick("water");
    pick("fire");
    expect(screen.getByText(/Known concept:/)).toBeTruthy();
    fireEvent.click(btn("Continue"));
    expect(screen.getByText(/Shelf \(1 bottled\)/)).toBeTruthy();
  });

  it("records the score the moment a bottle lands, with no button to forget", () => {
    render(<PocketAlchemistPage />);
    expect(screen.queryByRole("button", { name: /Save shelf score/ })).toBeNull();

    bottle("water", "fire");
    expect(best()).toBe(String(discoveryScore(1)));
  });

  it("keeps the best shelf from slipping back", () => {
    render(<PocketAlchemistPage />);
    bottle("water", "fire");
    const after = best();
    bottle("sun", "moon");
    expect(Number(best())).toBeGreaterThanOrEqual(Number(after));
  });
});
