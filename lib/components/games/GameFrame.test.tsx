import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PersonalBest, scoreBand } from "./GameFrame";

afterEach(cleanup);

const record = (best: number | null) =>
  ({
    id: "demo-game",
    best,
    clear: () => {},
    save: () => {},
    unavailable: false,
  }) as unknown as Parameters<typeof PersonalBest>[0]["record"];

describe("scoreBand", () => {
  it("covers the whole 0-100 range without a gap", () => {
    for (let score = 0; score <= 100; score++) {
      expect(scoreBand(score), `score ${score}`).toBeTruthy();
    }
  });

  it("names the boundaries the way the card promises", () => {
    expect(scoreBand(100)).toBe("Perfect");
    expect(scoreBand(90)).toBe("Excellent");
    expect(scoreBand(89.9)).toBe("Strong");
    expect(scoreBand(75)).toBe("Strong");
    expect(scoreBand(50)).toBe("Solid");
    expect(scoreBand(0)).toBe("Getting started");
  });
});

describe("PersonalBest card", () => {
  it("prints the number and a word, so the meter is never the only signal", () => {
    render(<PersonalBest record={record(87.5)} />);
    expect(screen.getByText("87.5")).toBeTruthy();
    expect(screen.getByText("Strong")).toBeTruthy();
  });

  it("keeps the meter width in step with the score", () => {
    const { container } = render(<PersonalBest record={record(42)} />);
    const fill = container.querySelector(".score-meter-fill") as HTMLElement;
    expect(fill.style.width).toBe("42%");
  });

  it("shows no meter before the first completed attempt", () => {
    const { container } = render(<PersonalBest record={record(null)} />);
    expect(container.querySelector(".score-meter")).toBeNull();
    expect(screen.getByText("No completed attempt yet.")).toBeTruthy();
  });

  it("still offers the reset control the other suites rely on", () => {
    render(<PersonalBest record={record(10)} />);
    expect(screen.getByRole("button", { name: "Reset personal best" })).toBeTruthy();
  });
});
