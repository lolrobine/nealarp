import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PerfectCirclePage from "./page";

/** jsdom ships no matchMedia, so a preference has to be stated to be read. */
function setMotionPreference(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reduce : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

const canvas = () => screen.getByLabelText(/Drawing canvas/) as HTMLCanvasElement;
const press = (key: string, times = 1) => {
  for (let i = 0; i < times; i += 1) fireEvent.keyDown(canvas(), { key });
};

/** Walk the keyboard pen around a closed loop of `side` steps per edge. */
function drawLoop(side: number) {
  press("Enter");
  press("ArrowRight", side);
  press("ArrowDown", side);
  press("ArrowLeft", side);
  press("ArrowUp", side);
  press("Enter");
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  Reflect.deleteProperty(window, "matchMedia");
});

describe("the keyboard pen", () => {
  it("puts the canvas in the tab order and says how it works", () => {
    render(<PerfectCirclePage />);
    expect(canvas().getAttribute("tabindex")).toBe("0");
    expect(canvas().getAttribute("aria-label")).toMatch(/arrow keys/i);
    expect(screen.getByText(/No mouse\?/)).toBeTruthy();
  });

  it("counts every arrow step as a point of the stroke", () => {
    render(<PerfectCirclePage />);
    press("Enter");
    press("ArrowRight", 4);
    expect(screen.getByText(/Drawing\.\.\. \(5 points\)/)).toBeTruthy();
  });

  it("scores the loop when Enter lifts the pen again", () => {
    render(<PerfectCirclePage />);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();

    drawLoop(8);

    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.getAllByText(/^\d+%$/).length).toBeGreaterThan(0);
  });

  it("records a keyboard attempt in the same best score a mouse would", () => {
    render(<PerfectCirclePage />);
    drawLoop(8);
    const best = Number(localStorage.getItem("perfect-circle-best"));
    expect(best).toBeGreaterThan(0);
    expect(best).toBeLessThanOrEqual(100);
  });

  it("clears the attempt on Escape", () => {
    render(<PerfectCirclePage />);
    press("Enter");
    press("ArrowRight", 4);
    expect(screen.getByText(/Drawing\.\.\./)).toBeTruthy();

    press("Escape");
    expect(screen.queryByText(/Drawing\.\.\./)).toBeNull();
    expect(screen.getByText(/Draw a circle on the canvas above/)).toBeTruthy();
  });

  it("treats Space the same as Enter", () => {
    render(<PerfectCirclePage />);
    press(" ");
    press("ArrowRight", 5);
    press(" ");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("replay", () => {
  it("is offered when motion is welcome", () => {
    setMotionPreference(false);
    render(<PerfectCirclePage />);
    drawLoop(8);
    expect(screen.getByRole("button", { name: "Replay drawing" })).toBeTruthy();
  });

  it("is not offered when it could only do nothing", () => {
    setMotionPreference(true);
    render(<PerfectCirclePage />);
    drawLoop(8);

    expect(screen.queryByRole("button", { name: "Replay drawing" })).toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export as image" })).toBeTruthy();
  });
});
