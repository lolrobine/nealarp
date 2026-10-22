import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import IcePost from "./page";
import { LEVELS } from "./logic";

const map = () => screen.getByRole("img", { name: /You are at/ });

describe("ice-post map", () => {
  it("draws the rink as one surface instead of a grid of cells", () => {
    const { container } = render(<IcePost />);
    expect(container.querySelector("canvas")).toBeTruthy();
    // The old board was 36 separate boxes; nothing should split the ice now.
    expect(container.querySelectorAll(".grid-cols-6").length).toBe(0);
  });

  it("keeps the position readable for screen readers", () => {
    render(<IcePost />);
    const start = LEVELS[0]!.start;
    expect(map().getAttribute("aria-label")).toContain(`You are at ${start.x + 1},${start.y + 1}`);
  });

  it("slides with the arrow keys as well as the buttons", () => {
    render(<IcePost />);
    const before = map().getAttribute("aria-label");
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(map().getAttribute("aria-label")).not.toBe(before);
  });

  it("lands the arrow key in the same place as the matching button", () => {
    const { unmount } = render(<IcePost />);
    fireEvent.keyDown(window, { key: "ArrowDown" });
    const viaKey = map().getAttribute("aria-label");
    unmount();
    render(<IcePost />);
    fireEvent.click(screen.getByRole("button", { name: "Slide down" }));
    expect(map().getAttribute("aria-label")).toBe(viaKey);
  });

  it("ignores arrow keys that would not move the parcel", () => {
    render(<IcePost />);
    fireEvent.keyDown(window, { key: "ArrowUp" });
    const start = LEVELS[0]!.start;
    expect(map().getAttribute("aria-label")).toContain(`You are at ${start.x + 1},${start.y + 1}`);
  });

  it("puts the parcel back with Reset", () => {
    render(<IcePost />);
    const start = map().getAttribute("aria-label");
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(map().getAttribute("aria-label")).toBe(start);
  });
});
