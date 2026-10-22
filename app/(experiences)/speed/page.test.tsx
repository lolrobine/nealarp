import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Speed from "./page";

function compare(a: string, b: string) {
  fireEvent.click(screen.getByRole("button", { name: `Compare ${a}` }));
  fireEvent.click(screen.getByRole("button", { name: `Compare ${b}` }));
}

describe("speed comparison", () => {
  it("offers a compare button that is visible rather than hover-only", () => {
    render(<Speed />);
    const button = screen.getByRole("button", { name: "Compare Snail" });
    expect(button.className).not.toContain("opacity-0");
  });

  it("marks the compared items as pressed", () => {
    render(<Speed />);
    compare("Snail", "Sloth");
    expect(screen.getByRole("button", { name: "Compare Sloth" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
  });

  it("races the two speeds against each other instead of showing numbers alone", () => {
    const { container } = render(<Speed />);
    expect(container.querySelector("canvas")).toBeNull();
    compare("Snail", "Sloth");
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas!.getAttribute("aria-hidden")).toBe("true");
  });

  it("states the race result in words for anyone who cannot see the track", () => {
    render(<Speed />);
    compare("Snail", "Sloth");
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/Top lane: Snail/);
    expect(status.textContent).toMatch(/Bottom lane: Sloth/);
    expect(status.textContent).toMatch(/covers .*% of it/);
  });

  it("keeps the ratio honest for a pair that is orders of magnitude apart", () => {
    render(<Speed />);
    compare("Snail", "Light (vacuum)");
    expect(screen.getByRole("status").textContent).toMatch(/less than 0.01%/);
  });
});
