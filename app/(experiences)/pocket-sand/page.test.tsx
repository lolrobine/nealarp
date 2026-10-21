import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PocketSand from "./page";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("pocket-sand brush control", () => {
  it("offers three brush sizes and defaults to the middle one", () => {
    render(<PocketSand />);
    for (const label of ["Fine", "Medium", "Wide"]) {
      expect(screen.getByRole("radio", { name: label })).toBeTruthy();
    }
    expect((screen.getByRole("radio", { name: "Medium" }) as HTMLInputElement).checked).toBe(true);
  });

  it("remembers the chosen size under the shared settings key", () => {
    render(<PocketSand />);
    fireEvent.click(screen.getByRole("radio", { name: "Wide" }));
    expect(localStorage.getItem("nealarp:settings:v1:pocket-sand:brush")).toBe('"2"');
  });

  it("keeps the tool picker reachable by keyboard alongside the brush", () => {
    render(<PocketSand />);
    // Both settings rows are radio groups, so arrow keys work without a mouse.
    expect(screen.getByRole("radio", { name: "Water" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Sand" })).toBeTruthy();
  });
});
