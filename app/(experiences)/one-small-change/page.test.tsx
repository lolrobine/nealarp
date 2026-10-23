import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import OneSmallChange from "./page";
import { bounceExperiment } from "./logic";

/**
 * jsdom ships no matchMedia at all, so both motion preferences have to be
 * stated explicitly here; neither is the default.
 */
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

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "matchMedia");
});

function run() {
  render(<OneSmallChange />);
  fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
}

describe("one-small-change playback controls", () => {
  it("offers play, replay and skip when motion is welcome", () => {
    setMotionPreference(false);
    run();
    expect(screen.getByRole("button", { name: "Replay drop" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show final state" })).toBeTruthy();
    expect(screen.queryByText(/asks for reduced motion/)).toBeNull();
  });

  it("does not explain reduced motion to someone who did not ask for it", () => {
    setMotionPreference(false);
    run();
    expect(screen.queryByText(/[Rr]educed.motion/)).toBeNull();
  });

  it("replaces the dead controls with an explanation when motion is reduced", () => {
    setMotionPreference(true);
    run();
    // play(), resume() and reset() all land on the final frame in this mode,
    // so three buttons that look interactive would do nothing at all.
    expect(screen.queryByRole("button", { name: "Replay drop" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Play / resume" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Show final state" })).toBeNull();
    expect(screen.getByText(/asks for reduced motion/)).toBeTruthy();
  });

  it("keeps the timeline, which is the one control that still works", () => {
    setMotionPreference(true);
    run();
    expect(screen.getByLabelText(/Experiment timeline/)).toBeTruthy();
  });
});

describe("one-small-change readable data", () => {
  it("tabulates the reference run at whole seconds", () => {
    setMotionPreference(true);
    run();
    const reference = bounceExperiment(0.65);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(9);
    rows.forEach((row, second) => {
      const cells = row.querySelectorAll("td");
      expect(cells[0]?.textContent).toBe(reference.samples[second * 60]!.height.toFixed(2));
    });
  });

  it("starts the drop at the full five metres", () => {
    setMotionPreference(true);
    run();
    const firstRow = screen.getAllByRole("row")[1];
    expect(firstRow?.querySelectorAll("td")[0]?.textContent).toBe("5.00");
  });
});
