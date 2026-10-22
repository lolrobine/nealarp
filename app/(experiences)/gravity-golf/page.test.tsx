import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import GravityGolf from "./page";
import { GOLF_LEVELS, golfScore, simulateFlight } from "./logic";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

/** A shot that reaches the goal on the opening level, found by sweeping the
 *  whole control range rather than guessed. */
const FIRST_LEVEL_ACE = { angle: 0, power: 120 };

function launch(angle: number, power: number) {
  fireEvent.change(screen.getByLabelText(/Launch angle/i), { target: { value: String(angle) } });
  fireEvent.change(screen.getByLabelText(/Launch power/i), { target: { value: String(power) } });
  fireEvent.click(screen.getByRole("button", { name: "Launch ball" }));
}

describe("gravity golf levels", () => {
  it("every level can actually be holed with the controls the page offers", () => {
    for (const level of GOLF_LEVELS) {
      let solved = false;
      for (let angle = 0; angle <= 80 && !solved; angle += 0.5) {
        for (let power = 60; power <= 220 && !solved; power += 1) {
          if (simulateFlight(level, angle, power).outcome === "goal") solved = true;
        }
      }
      expect(solved, `${level.name} has no winning shot`).toBe(true);
    }
  });

  it("scores a hole in one at 100 and never leaves the 0-100 band", () => {
    expect(golfScore(1)).toBe(100);
    for (let shots = 1; shots <= 20; shots++) {
      expect(golfScore(shots)).toBeGreaterThanOrEqual(0);
      expect(golfScore(shots)).toBeLessThanOrEqual(100);
    }
  });

  it("the sweep that picked the test shot still holes it", () => {
    const flight = simulateFlight(GOLF_LEVELS[0]!, FIRST_LEVEL_ACE.angle, FIRST_LEVEL_ACE.power);
    expect(flight.outcome).toBe("goal");
  });
});

describe("gravity golf page", () => {
  it("announces a first-shot goal and its score in a live region", () => {
    render(<GravityGolf />);
    launch(FIRST_LEVEL_ACE.angle, FIRST_LEVEL_ACE.power);
    expect(screen.getByRole("status").textContent).toContain("Goal! Score: 100 / 100.");
  });

  it("drives the whole shot from the keyboard, with no pointer involved", () => {
    render(<GravityGolf />);
    const angle = screen.getByLabelText(/Launch angle/i) as HTMLInputElement;
    const power = screen.getByLabelText(/Launch power/i) as HTMLInputElement;
    expect(angle.tagName).toBe("INPUT");
    expect(angle.type).toBe("range");
    expect(power.type).toBe("range");
    // Range inputs are arrow-key operable by the platform; the page must not
    // disable them before the first shot.
    expect(angle.disabled).toBe(false);
    expect(power.disabled).toBe(false);
  });

  it("counts shots and stops the run at eight", () => {
    render(<GravityGolf />);
    expect(screen.getByText("Shots used: 0 / 8")).toBeTruthy();
    // A deliberate miss: straight up at minimum power leaves the course.
    launch(80, 60);
    expect(screen.getByText("Shots used: 1 / 8")).toBeTruthy();
    expect(screen.getByRole("status").textContent).not.toBe("");
  });

  it("restarting the level puts the shot counter back to zero", () => {
    render(<GravityGolf />);
    launch(80, 60);
    expect(screen.getByText("Shots used: 1 / 8")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Restart level" }));
    expect(screen.getByText("Shots used: 0 / 8")).toBeTruthy();
  });

  it("offers every level by name and swaps the course when one is chosen", () => {
    render(<GravityGolf />);
    const select = screen.getByLabelText("Level") as HTMLSelectElement;
    expect(select.options).toHaveLength(GOLF_LEVELS.length);
    expect(select.options[1]!.textContent).toContain(GOLF_LEVELS[1]!.name);
    launch(80, 60);
    expect(screen.getByText("Shots used: 1 / 8")).toBeTruthy();
    fireEvent.change(select, { target: { value: "1" } });
    // The course remounts, so the new level starts from a clean counter.
    expect(screen.getByText("Shots used: 0 / 8")).toBeTruthy();
  });

  it("describes the course in text, so the picture is not the only way in", () => {
    render(<GravityGolf />);
    expect(
      screen.getByLabelText("Gravity golf course with tee, gravity sources, obstacles, and goal")
    ).toBeTruthy();
    expect(screen.getByText(/Tee \(/)).toBeTruthy();
    expect(screen.getByText(/Planet centers:/)).toBeTruthy();
  });
});
