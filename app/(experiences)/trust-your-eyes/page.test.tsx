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
