import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import CurrentCourier from "./page";
import { MAPS } from "./logic";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("current-courier map", () => {
  it("draws every street of the active map, not just the junctions", () => {
    const { container } = render(<CurrentCourier />);
    // Regression: the map used to be bare buttons, which read as loose dots.
    const lines = container.querySelectorAll("svg line");
    expect(lines.length).toBe(MAPS[0]!.edges.length);
  });

  it("draws no route polyline until two junctions are linked", () => {
    const { container } = render(<CurrentCourier />);
    expect(container.querySelector("svg polyline")).toBeNull();
    fireEvent.click(screen.getByRole("gridcell", { name: /^A1 stop/ }));
    expect(container.querySelector("svg polyline")).toBeNull();
    fireEvent.click(screen.getByRole("gridcell", { name: "B1" }));
    expect(container.querySelector("svg polyline")).not.toBeNull();
  });

  it("walks the worked example to a par route worth 100", () => {
    render(<CurrentCourier />);
    for (const node of ["A1", "B1", "C1", "C2", "C3", "B3", "A3"]) {
      fireEvent.click(screen.getByRole("gridcell", { name: new RegExp(`^${node}\\b`) }));
    }
    expect(screen.getByText(/Route length: 6 \/ par 6/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Finish route" }));
    expect(localStorage.getItem("nealarp:best:v1:current-courier")).toBe("100");
  });

  it("redraws the streets when another map is chosen", () => {
    const { container } = render(<CurrentCourier />);
    fireEvent.click(screen.getByRole("button", { name: /^5\. Harbour grid/ }));
    expect(container.querySelectorAll("svg line").length).toBe(MAPS[4]!.edges.length);
  });
});
