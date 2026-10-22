import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import TwinTilt from "./page";
import { ROOMS } from "./logic";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const turnCw = () => screen.getByRole("button", { name: /Turn the room clockwise/ });
const turnCcw = () => screen.getByRole("button", { name: /Turn the room counterclockwise/ });

/** A press and release with no time in between: the tap shortcut. */
function tap(button: HTMLElement) {
  fireEvent.pointerDown(button);
  fireEvent.pointerUp(window);
}

describe("twin-tilt page", () => {
  it("starts with gravity down and no moves spent", () => {
    render(<TwinTilt />);
    expect(screen.getByText(/Gravity in the room points/).textContent).toContain("down");
    expect(screen.getByText(/Moves/).textContent).toContain("0");
  });

  it("counts a quick tap as exactly one quarter turn", () => {
    render(<TwinTilt />);
    tap(turnCw());
    expect(screen.getByText(/Moves/).textContent).toContain("1");
    // Turning the room clockwise walks gravity round to the right-hand wall.
    expect(screen.getByText(/Gravity in the room points/).textContent).toContain("right");
  });

  it("comes back to the start after four quarter turns", () => {
    render(<TwinTilt />);
    // Room 2, because the one-marble tutorial is already solved after three.
    fireEvent.click(screen.getByRole("button", { name: /^2\. Twin drop/ }));
    for (let i = 0; i < 4; i++) tap(turnCw());
    expect(screen.getByText(/Gravity in the room points/).textContent).toContain("down");
    expect(screen.getByText(/Moves/).textContent).toContain("4");
  });

  it("turns the other way too", () => {
    render(<TwinTilt />);
    tap(turnCcw());
    expect(screen.getByText(/Gravity in the room points/).textContent).toContain("left");
  });

  it("keeps keyboard parity: hold an arrow key, release to settle", () => {
    render(<TwinTilt />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // Still nothing: the room is mid-swing until the key comes back up.
    expect(screen.getByText(/Moves/).textContent).toContain("0");
    fireEvent.keyUp(window, { key: "ArrowRight" });
    expect(screen.getByText(/Moves/).textContent).toContain("1");
    expect(screen.getByText(/Gravity in the room points/).textContent).toContain("right");
  });

  it("ignores auto-repeat so one held key is one swing", () => {
    render(<TwinTilt />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight", repeat: true });
    fireEvent.keyDown(window, { key: "ArrowRight", repeat: true });
    fireEvent.keyUp(window, { key: "ArrowRight" });
    expect(screen.getByText(/Moves/).textContent).toContain("1");
  });

  it("undoes a turn", () => {
    render(<TwinTilt />);
    tap(turnCw());
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText(/Moves/).textContent).toContain("0");
    expect(screen.getByText(/Gravity in the room points/).textContent).toContain("down");
  });

  it("describes every marble for screen readers", () => {
    render(<TwinTilt />);
    // Room 1 is the one-marble tutorial.
    expect(screen.getByRole("status").textContent).toMatch(/Ball A at [A-F]\d/);
    // Room 2 is the first with a twin, and both must be announced.
    fireEvent.click(screen.getByRole("button", { name: /^2\. Twin drop/ }));
    const status = screen.getByRole("status").textContent ?? "";
    expect(status).toMatch(/Ball A at [A-F]\d/);
    expect(status).toMatch(/Ball B at [A-F]\d/);
  });

  it("solves room 1 with its par solution and scores it", () => {
    render(<TwinTilt />);
    // The stored solution is in rule terms; turning the room counterclockwise
    // on screen is what the rules call a "cw" move.
    for (const move of ROOMS[0]!.solution) {
      tap(move === "cw" ? turnCcw() : turnCw());
    }
    expect(screen.getByText(/Room solved in 2 moves/)).toBeTruthy();
    expect(screen.getByText(/100 \/ 100/)).toBeTruthy();
  });

  it("resets the room", () => {
    render(<TwinTilt />);
    tap(turnCw());
    tap(turnCw());
    fireEvent.click(screen.getByRole("button", { name: "Reset room" }));
    expect(screen.getByText(/Moves/).textContent).toContain("0");
  });
});
