import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import OneSecondOff from "./page";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("completes all three rounds, saves a best and restarts", () => {
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  render(<OneSecondOff />);
  for (const seconds of [3, 7, 10]) {
    fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
    now += seconds * 1000;
    fireEvent.click(screen.getByRole("button", { name: "Stop timer" }));
    if (seconds !== 10) fireEvent.click(screen.getByRole("button", { name: "Next round" }));
  }
  expect(screen.getByText("Final score: 100.0 / 100")).toBeTruthy();
  expect(localStorage.getItem("nealarp:best:v1:one-second-off:session")).toBe("100");
  fireEvent.click(screen.getByRole("button", { name: "Restart" }));
  expect(screen.getByRole("button", { name: "Start timer" })).toBeTruthy();
  expect(screen.queryByText(/Final score:/)).toBeNull();
});
it("cancels a hidden-tab attempt without scoring", () => {
  render(<OneSecondOff />);
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(screen.getByText(/Round cancelled:/)).toBeTruthy();
  expect(localStorage.getItem("nealarp:best:v1:one-second-off:session")).toBeNull();
});
it("keeps single-target records separate", () => {
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  render(<OneSecondOff />);
  fireEvent.change(screen.getByLabelText("Mode"), { target: { value: "single" } });
  fireEvent.change(screen.getByLabelText("Target"), { target: { value: "7" } });
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  now = 7000;
  fireEvent.click(screen.getByRole("button", { name: "Stop timer" }));
  expect(localStorage.getItem("nealarp:best:v1:one-second-off:7")).toBe("100");
  expect(localStorage.getItem("nealarp:best:v1:one-second-off:session")).toBeNull();
});

it("the large timer pad supports starting and stopping directly", () => {
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  render(<OneSecondOff />);
  fireEvent.click(screen.getByRole("button", { name: "Timer pad — start" }));
  now = 3000;
  fireEvent.click(screen.getByRole("button", { name: "Timer pad — stop" }));
  expect(screen.getByText(/Round 1: 3.000 s/)).toBeTruthy();
});

it("shows the measured time on the large pad after a round instead of the target", () => {
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  render(<OneSecondOff />);
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  now = 3456;
  fireEvent.click(screen.getByRole("button", { name: "Stop timer" }));
  const result = screen.getByRole("button", { name: "Round result: 3.456 seconds" });
  expect(result.textContent).toContain("3.456");
  expect(result.hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Next round" }));
  expect(screen.getByRole("button", { name: "Timer pad — start" }).textContent).toContain("7.000");
});

it("keeps the growing round list out of the live region", () => {
  let now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  render(<OneSecondOff />);
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  now = 3000;
  fireEvent.click(screen.getByRole("button", { name: "Stop timer" }));

  // A role="status" wrapped around the list meant every finished round
  // re-announced every earlier round.
  const row = screen.getByText(/Round 1: 3.000 s/);
  expect(row.closest('[role="status"]')).toBeNull();
});

it("says what a good score looks like before the first round", () => {
  render(<OneSecondOff />);
  expect(screen.getByText(/Where the points actually are/)).toBeTruthy();
  expect(screen.getByText(/costs 5 points on the 10-second round and 16.7/)).toBeTruthy();
  expect(screen.getByText(/every round scores 95, for a session mean of 95 \/ 100/)).toBeTruthy();
});
