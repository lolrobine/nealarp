import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PassThePencilPage from "./page";
import { buildRun, dailySeed, ROUNDS } from "./logic";

function canvas() {
  return screen.getByLabelText(/Drawing canvas/);
}

/** The announcement is the one place the pen's state is readable from outside. */
function penState() {
  return screen.getByText(/Pen (up|down) at/).textContent ?? "";
}

function press(key: string, shiftKey = false) {
  fireEvent.keyDown(canvas(), { key, shiftKey });
}

/** Draw something, anything, so the round can be submitted. */
function scribble() {
  press("Enter");
  press("ArrowRight");
  press("ArrowDown");
  press("Enter");
}

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("drawing with the keyboard", () => {
  it("puts the canvas in the tab order", () => {
    render(<PassThePencilPage />);
    expect(canvas().getAttribute("tabindex")).toBe("0");
  });

  it("walks the pen with the arrow keys", () => {
    render(<PassThePencilPage />);
    expect(penState()).toContain("at 320, 180");

    press("ArrowRight");
    expect(penState()).toContain("at 332, 180");

    press("ArrowUp");
    expect(penState()).toContain("at 332, 168");
  });

  it("takes smaller steps while shift is held", () => {
    render(<PassThePencilPage />);
    press("ArrowRight", true);
    expect(penState()).toContain("at 324, 180");
  });

  it("stops the pen at the edge of the sheet instead of running off it", () => {
    render(<PassThePencilPage />);
    for (let i = 0; i < 40; i++) press("ArrowLeft");
    expect(penState()).toContain("at 0, 180");
    for (let i = 0; i < 40; i++) press("ArrowUp");
    expect(penState()).toContain("at 0, 0");
  });

  it("puts the pen down and lifts it with enter", () => {
    render(<PassThePencilPage />);
    expect(penState()).toContain("Pen up");
    press("Enter");
    expect(penState()).toContain("Pen down");
    press("Enter");
    expect(penState()).toContain("Pen up");
  });

  it("records a stroke only while the pen is down", () => {
    render(<PassThePencilPage />);
    press("ArrowRight");
    expect(screen.getByText("0 strokes on the sheet")).toBeTruthy();

    press("Enter");
    press("ArrowRight");
    expect(screen.getByText("1 stroke on the sheet")).toBeTruthy();

    press("Enter");
    press("Enter");
    expect(screen.getByText("2 strokes on the sheet")).toBeTruthy();
  });

  it("will not submit a blank sheet", () => {
    render(<PassThePencilPage />);
    const done = screen.getByRole("button", { name: "Done drawing" }) as HTMLButtonElement;
    expect(done.disabled).toBe(true);
    scribble();
    expect(
      (screen.getByRole("button", { name: "Done drawing" }) as HTMLButtonElement).disabled
    ).toBe(false);
  });

  it("clears the sheet and lifts the pen", () => {
    render(<PassThePencilPage />);
    press("Enter");
    press("ArrowRight");
    fireEvent.click(screen.getByRole("button", { name: "Clear drawing" }));
    expect(screen.getByText("0 strokes on the sheet")).toBeTruthy();
    expect(penState()).toContain("Pen up");
  });
});

describe("the round of six", () => {
  it("shows the prompt on a prompt round and hides it on a memory round", () => {
    const rounds = buildRun(dailySeed());
    render(<PassThePencilPage />);

    expect(screen.getByText(rounds[0]!.prompt)).toBeTruthy();
    expect(screen.getByText(/Round 1 of 6 · prompt round/)).toBeTruthy();

    scribble();
    fireEvent.click(screen.getByRole("button", { name: "Done drawing" }));
    fireEvent.click(screen.getByRole("button", { name: /^Score round/ }));

    expect(screen.getByText(/Round 2 of 6 · memory round/)).toBeTruthy();
    expect(screen.queryByText(rounds[1]!.prompt)).toBeNull();
    expect(screen.getByText(/Prompt hidden/)).toBeTruthy();
  });

  it("averages the six rounds into the record", () => {
    render(<PassThePencilPage />);
    for (let i = 0; i < ROUNDS; i++) {
      scribble();
      fireEvent.click(screen.getByRole("button", { name: "Done drawing" }));
      fireEvent.change(screen.getByLabelText(/^Recognition/), { target: { value: "5" } });
      fireEvent.change(screen.getByLabelText(/^Effort/), { target: { value: "5" } });
      fireEvent.click(screen.getByRole("button", { name: /^Score round/ }));
    }
    expect(screen.getByText("Game complete")).toBeTruthy();
    expect(localStorage.getItem("nealarp:best:v1:pass-the-pencil")).toBe("100");
  });
});
