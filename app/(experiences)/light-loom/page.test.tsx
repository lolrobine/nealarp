import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
