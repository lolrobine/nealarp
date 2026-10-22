import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SizeOfSpace from "./page";
import { spaceObjects } from "./data";

// The dropdown lists the same names, so target the card label specifically.
const pick = (name: string) =>
  fireEvent.click(screen.getByText(name, { selector: "span.font-semibold" }));

describe("size-of-space scale stage", () => {
  it("shows nothing until a second object is chosen", () => {
    render(<SizeOfSpace />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("puts the two objects side by side with their true ratio", () => {
    render(<SizeOfSpace />);
    pick("Blue Whale");
    const status = screen.getByRole("status");
    // Default base is a Human at 1.7 m; a 30 m whale is 17.6 times that.
    expect(status.textContent).toMatch(/Blue Whale/);
    expect(status.textContent).toMatch(/17\.6×/);
  });

  it("admits when the smaller object had to be pinned to a floor size", () => {
    render(<SizeOfSpace />);
    pick("Jupiter");
    expect(screen.getByText(/pinned to 4 pixels/)).toBeTruthy();
    expect(screen.getByText(/understates the gap/)).toBeTruthy();
  });

  it("says both are to scale when they actually are", () => {
    render(<SizeOfSpace />);
    pick("Blue Whale");
    expect(screen.getByText(/Both drawn to scale against each other/)).toBeTruthy();
  });

  it("labels the pictures as AI-generated wherever they are shown", () => {
    render(<SizeOfSpace />);
    pick("Blue Whale");
    expect(screen.getByText(/AI-generated illustrations, not photographs/)).toBeTruthy();
  });
});

describe("size-of-space data", () => {
  it("only points at images that live under the game's own folder", () => {
    for (const object of spaceObjects) {
      if (!object.image) continue;
      expect(object.image).toMatch(/^\/experiences\/size-of-space\/objects\/[a-z-]+\.jpg$/);
    }
  });

  it("now has a picture for every single object", () => {
    expect(spaceObjects.filter((o) => !o.image).map((o) => o.name)).toEqual([]);
  });

  it("gives every object that is a thing rather than a gap a picture", () => {
    const missing = spaceObjects.filter((o) => o.category !== "distances").filter((o) => !o.image);
    expect(missing).toEqual([]);
  });
});
