import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CopyMachinePage from "./page";
import { GENERATIONS } from "./logic";

function canvas() {
  return screen.getByLabelText(/Drawing canvas/);
}

function penState() {
  return screen.getByText(/Pen (up|down) at/).textContent ?? "";
}

function press(key: string, shiftKey = false) {
  fireEvent.keyDown(canvas(), { key, shiftKey });
}

/** One keyboard stroke, pen down and back up. */
function drawStroke() {
  press("Enter");
  press("ArrowRight");
  press("ArrowDown");
  press("Enter");
}

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("copying with the keyboard", () => {
  it("puts the canvas in the tab order", () => {
    render(<CopyMachinePage />);
    expect(canvas().getAttribute("tabindex")).toBe("0");
  });

  it("no longer tells keyboard users the game needs a finger or a mouse", () => {
    render(<CopyMachinePage />);
    expect(screen.queryByText(/finger or the mouse/)).toBeNull();
    expect(screen.getByText(/arrow keys and Enter/)).toBeTruthy();
  });

  it("walks the pen and holds it at the edges", () => {
    render(<CopyMachinePage />);
    expect(penState()).toContain("at 160, 160");

    press("ArrowRight");
    expect(penState()).toContain("at 170, 160");

    press("ArrowLeft", true);
    expect(penState()).toContain("at 167, 160");

    for (let i = 0; i < 40; i++) press("ArrowRight");
    expect(penState()).toContain("at 320, 160");
  });

  it("counts a stroke only once the pen goes down", () => {
    render(<CopyMachinePage />);
    press("ArrowRight");
    expect(penState()).toContain("0 strokes drawn");

    press("Enter");
    expect(penState()).toContain("1 stroke drawn");

    press("ArrowRight");
    expect(penState()).toContain("1 stroke drawn");
  });

  it("enables the copy buttons once something is drawn", () => {
    render(<CopyMachinePage />);
    const button = () =>
      screen.getByRole("button", { name: "This is my copy" }) as HTMLButtonElement;
    expect(button().disabled).toBe(true);
    drawStroke();
    expect(button().disabled).toBe(false);
  });

  it("lifts the pen when a stroke is undone", () => {
    // Undoing with the pen still down used to leave it attached to whichever
    // stroke the undo uncovered.
    render(<CopyMachinePage />);
    press("Enter");
    press("ArrowRight");
    expect(penState()).toContain("Pen down");

    fireEvent.click(screen.getByRole("button", { name: "Undo stroke" }));

    expect(penState()).toContain("Pen up");
    expect(penState()).toContain("0 strokes drawn");
  });
});

describe("the lineage", () => {
  it("walks five generations to the drift film, scoring each copy", () => {
    render(<CopyMachinePage />);
    for (let generation = 0; generation < GENERATIONS; generation++) {
      expect(
        screen.getByText(new RegExp(`Generation ${generation + 1} of ${GENERATIONS}`))
      ).toBeTruthy();
      drawStroke();
      const last = generation === GENERATIONS - 1;
      fireEvent.click(
        screen.getByRole("button", { name: last ? "Finish lineage" : "This is my copy" })
      );
    }
    expect(screen.getByText("The drift film")).toBeTruthy();
    const scoreList = screen.getByText("Copy scores").parentElement!.querySelector("ul")!;
    expect(scoreList.querySelectorAll("li")).toHaveLength(GENERATIONS);
    expect(localStorage.getItem("nealarp:best:v1:copy-machine")).not.toBeNull();
  });

  it("starts the lineage over when another glyph is chosen", () => {
    render(<CopyMachinePage />);
    drawStroke();
    fireEvent.click(screen.getByRole("button", { name: "This is my copy" }));
    expect(screen.getByText(new RegExp(`Generation 2 of ${GENERATIONS}`))).toBeTruthy();

    const glyphs = screen.getAllByRole("button", { pressed: false });
    fireEvent.click(glyphs[0]!);

    expect(screen.getByText(new RegExp(`Generation 1 of ${GENERATIONS}`))).toBeTruthy();
    expect(penState()).toContain("0 strokes drawn");
  });
});
