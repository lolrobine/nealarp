import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LightLoom from "./page";
import { LEVELS } from "./logic";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

/** Place one optic by activating its square through the accessible name. */
function activateCell(x: number, y: number) {
  const cell = screen.getByRole("button", {
    name: new RegExp(`^Column ${x + 1}, row ${y + 1}:`),
  });
  fireEvent.click(cell);
}

describe("light-loom page", () => {
  it("does not hand out a win before the player places anything", () => {
    render(<LightLoom />);
    // Regression: the board used to ship pre-solved, so opening a level scored 100.
    expect(screen.queryByText(/Every target coloured/)).toBeNull();
    expect(screen.getByRole("group", { name: /0 of \d+ targets lit/i })).toBeTruthy();
    expect(localStorage.getItem("nealarp:best:v1:light-loom")).toBeNull();
  });

  it("solves level 1 by placing the tray mirror on the right square", () => {
    render(<LightLoom />);
    const [placement] = LEVELS[0]!.solution;
    activateCell(placement!.x, placement!.y);
    expect(screen.getByText(/Every target coloured/)).toBeTruthy();
    // Four levels, so one solved level is a quarter of the score.
    expect(localStorage.getItem("nealarp:best:v1:light-loom")).toBe("25");
  });

  it("lets the player pick a placed optic back up", () => {
    render(<LightLoom />);
    const [placement] = LEVELS[0]!.solution;
    activateCell(placement!.x, placement!.y);
    expect(screen.getByText(/Every target coloured/)).toBeTruthy();
    activateCell(placement!.x, placement!.y);
    expect(screen.queryByText(/Every target coloured/)).toBeNull();
  });

  it("refuses to drop an optic on a fixed square", () => {
    render(<LightLoom />);
    // The lamp sits at column 1, row 1 on level 1 and must stay put.
    const lamp = screen.getByRole("button", { name: /^Column 1, row 1: lamp/ });
    expect(lamp.hasAttribute("disabled")).toBe(true);
  });

  it("clears the board again", () => {
    render(<LightLoom />);
    const [placement] = LEVELS[0]!.solution;
    activateCell(placement!.x, placement!.y);
    fireEvent.click(screen.getByRole("button", { name: "Clear optics" }));
    expect(screen.queryByText(/Every target coloured/)).toBeNull();
  });

  it("offers every tray optic as a labelled radio option", () => {
    render(<LightLoom />);
    fireEvent.click(screen.getByRole("button", { name: /^4\. Prism trio/ }));
    // Level 4 ships a mirror and a prism; both must be selectable.
    expect(screen.getByRole("radio", { name: /Mirror/ })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Prism/ })).toBeTruthy();
  });

  it("scores 100 only after all four levels are solved", () => {
    render(<LightLoom />);
    LEVELS.forEach((level, index) => {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${index + 1}\\. `) }));
      for (const placement of level.solution) {
        // Select the matching optic before dropping it.
        const label = placement.kind === "prism" ? /Prism/ : /Mirror/;
        const option = screen.queryAllByRole("radio", { name: label })[0];
        if (option) fireEvent.click(option);
        activateCell(placement.x, placement.y);
      }
    });
    expect(localStorage.getItem("nealarp:best:v1:light-loom")).toBe("100");
  });
});

describe("light-loom drag and drop", () => {
  /** jsdom reports a zero-sized board, so hit-testing needs a real rectangle. */
  function sizeTheBoard() {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 480,
      height: 480,
      right: 480,
      bottom: 480,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  }
  const centre = (n: number) => n * 80 + 40;

  afterEach(() => vi.restoreAllMocks());

  it("places an optic by pressing and releasing on one square", () => {
    sizeTheBoard();
    render(<LightLoom />);
    const [placement] = LEVELS[0]!.solution;
    const square = screen.getByRole("button", {
      name: new RegExp(`^Column ${placement!.x + 1}, row ${placement!.y + 1}:`),
    });
    fireEvent.pointerDown(square, { button: 0 });
    fireEvent.pointerUp(window);
    expect(screen.getByText(/Every target coloured/)).toBeTruthy();
  });

  it("follows the pointer, so the optic lands where the finger lifts", () => {
    sizeTheBoard();
    render(<LightLoom />);
    const [placement] = LEVELS[0]!.solution;
    // Grab on a different free square, then slide onto the solving one.
    const start = screen.getByRole("button", { name: /^Column 3, row 3:/ });
    fireEvent.pointerDown(start, { button: 0 });
    expect(screen.queryByText(/Every target coloured/)).toBeNull();
    fireEvent.pointerMove(window, {
      clientX: centre(placement!.x),
      clientY: centre(placement!.y),
    });
    fireEvent.pointerUp(window);
    expect(screen.getByText(/Every target coloured/)).toBeTruthy();
  });

  it("returns the optic to the tray when it is dropped off the board", () => {
    sizeTheBoard();
    render(<LightLoom />);
    const [placement] = LEVELS[0]!.solution;
    const square = screen.getByRole("button", {
      name: new RegExp(`^Column ${placement!.x + 1}, row ${placement!.y + 1}:`),
    });
    fireEvent.pointerDown(square, { button: 0 });
    fireEvent.pointerMove(window, { clientX: 2000, clientY: 2000 });
    fireEvent.pointerUp(window);
    expect(screen.queryByText(/Every target coloured/)).toBeNull();
    // Nothing was consumed, so the full tray is still available.
    expect(screen.getByText(/Optics left/).textContent).toContain(String(LEVELS[0]!.tray.length));
  });
});
