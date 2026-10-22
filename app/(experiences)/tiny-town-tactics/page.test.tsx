import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TinyTown from "./page";

const cell = (x: number, y: number) =>
  screen.getByRole("gridcell", { name: new RegExp(`^Cell ${x},${y}:`) });

describe("tiny-town-tactics clarity", () => {
  it("shows every empty cell what the current tile would score there", () => {
    render(<TinyTown />);
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/scores plus 1$/);
    expect(cell(1, 1).textContent).toBe("+1");
  });

  it("updates the preview once a neighbour exists", () => {
    render(<TinyTown />);
    fireEvent.click(cell(1, 1));
    const neighbour = cell(2, 1).getAttribute("aria-label")!;
    expect(neighbour).toMatch(/scores (plus|minus) \d+$/);
    // The first tile is already down, so this is no longer a bare +1 everywhere.
    expect(cell(5, 5).getAttribute("aria-label")).toMatch(/scores plus 1$/);
  });

  it("uses drawn tiles rather than emoji", () => {
    const { container } = render(<TinyTown />);
    fireEvent.click(cell(1, 1));
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it("stops previewing a cell that is already built on", () => {
    render(<TinyTown />);
    fireEvent.click(cell(1, 1));
    expect(cell(1, 1).getAttribute("aria-label")).not.toMatch(/scores/);
    expect(cell(1, 1).hasAttribute("disabled")).toBe(true);
  });

  it("keeps the running score in step with the previews it promised", () => {
    render(<TinyTown />);
    const promised = Number(cell(3, 3).textContent!.replace("+", ""));
    fireEvent.click(cell(3, 3));
    expect(screen.getByText(new RegExp(`Score: ${promised}`))).toBeTruthy();
  });
});
