import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import TrustYourEyes from "./page";

beforeEach(() => localStorage.clear());
afterEach(cleanup);
it("scores six estimates, reveals answers, saves and resets the record", () => {
  render(<TrustYourEyes />);
  for (let round = 0; round < 6; round++) {
    const angle = round === 2 || round === 5;
    fireEvent.change(screen.getByLabelText(angle ? "Angle estimate" : "Horizontal position"), {
      target: { value: angle ? (round === 2 ? "35" : "125") : "50" },
    });
    if (round === 1 || round === 4)
      fireEvent.change(screen.getByLabelText("Vertical position"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit estimate" }));
    expect(screen.getByText("Round score: 100.0 / 100")).toBeTruthy();
    expect(screen.getByText(/Correct (position|angle):/)).toBeTruthy();
    if (round < 5) fireEvent.click(screen.getByRole("button", { name: "Next challenge" }));
  }
  expect(screen.getByText("Final score: 100.0 / 100")).toBeTruthy();
  expect(localStorage.getItem("nealarp:best:v1:trust-your-eyes:session")).toBe("100");
  fireEvent.click(screen.getByRole("button", { name: "Restart" }));
  expect(screen.queryByText(/Final score:/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Reset personal best" }));
  expect(localStorage.getItem("nealarp:best:v1:trust-your-eyes:session")).toBeNull();
});

it("draws the guessed angle next to the real one once the round is submitted", () => {
  const { container } = render(<TrustYourEyes />);
  // Rounds 1 and 2 are line and centre; round 3 is the first angle task.
  for (let i = 0; i < 2; i++) {
    fireEvent.click(screen.getByRole("button", { name: "Submit estimate" }));
    fireEvent.click(screen.getByRole("button", { name: "Next challenge" }));
  }
  expect(screen.getByRole("heading", { name: "Estimate the angle" })).toBeTruthy();

  const dashedBefore = container.querySelectorAll("path[stroke-dasharray]").length;
  fireEvent.click(screen.getByRole("button", { name: "Submit estimate" }));
  const dashedAfter = container.querySelectorAll("path[stroke-dasharray]").length;

  // The line and centre rounds both reveal the truth on the diagram; the angle
  // round used to reveal it in words only.
  expect(dashedBefore).toBe(0);
  expect(dashedAfter).toBe(1);
});

it("names the task's own target when revealing a line round", () => {
  render(<TrustYourEyes />);
  fireEvent.click(screen.getByRole("button", { name: "Submit estimate" }));
  expect(screen.getByText(/Correct position: 50%/)).toBeTruthy();
});

it("warns that the three round types are not graded on one scale", () => {
  render(<TrustYourEyes />);
  expect(screen.getByText(/not graded on the same scale/)).toBeTruthy();
  expect(screen.getByText(/80 on a line round, 85.9 on a centre round and 88.9/)).toBeTruthy();
});
