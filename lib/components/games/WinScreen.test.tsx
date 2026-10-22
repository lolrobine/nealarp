import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WinScreen } from "./WinScreen";

describe("WinScreen", () => {
  it("keeps the score in one text node so it never reads as two numbers", () => {
    render(<WinScreen headline="Room solved" score={100} />);
    expect(screen.getByText("100 / 100")).toBeTruthy();
  });

  it("names the band that goes with the score", () => {
    render(<WinScreen headline="Done" score={82} />);
    expect(screen.getByText("82 / 100")).toBeTruthy();
    expect(screen.getByText("Strong")).toBeTruthy();
  });

  it("prints one decimal only when the score has one", () => {
    const { rerender } = render(<WinScreen headline="Done" score={91.25} />);
    expect(screen.getByText("91.3 / 100")).toBeTruthy();
    rerender(<WinScreen headline="Done" score={91} />);
    expect(screen.getByText("91 / 100")).toBeTruthy();
  });

  it("clamps a score that escaped its formula", () => {
    render(<WinScreen headline="Done" score={140} />);
    expect(screen.getByText("100 / 100")).toBeTruthy();
  });

  it("shows no score block at all when a game does not score the round", () => {
    const { container } = render(<WinScreen headline="Every target coloured" />);
    expect(container.querySelector(".score-meter")).toBeNull();
    expect(screen.queryByText(/\/ 100/)).toBeNull();
  });

  it("announces itself politely so the result is not missed", () => {
    const { container } = render(<WinScreen headline="Done" score={50} />);
    expect(container.firstElementChild?.getAttribute("aria-live")).toBe("polite");
  });

  it("renders the actions a game passes as children", () => {
    render(
      <WinScreen headline="Done" score={50}>
        <button type="button">Next room</button>
      </WinScreen>
    );
    expect(screen.getByRole("button", { name: "Next room" })).toBeTruthy();
  });
});
