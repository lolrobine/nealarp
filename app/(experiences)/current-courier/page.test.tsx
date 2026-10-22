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

/** jsdom does no layout, so give the map a known 300x300 box: 3x3 cells of 100. */
function sizeTheMap(container: HTMLElement): HTMLElement {
  const grid = container.querySelector('[aria-label="Delivery map"]') as HTMLElement;
  grid.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0 }) as DOMRect;
  return grid;
}

const CENTRE: Record<string, [number, number]> = {
  A1: [50, 50],
  B1: [150, 50],
  C1: [250, 50],
  C2: [250, 150],
  C3: [250, 250],
  B3: [150, 250],
  A3: [50, 250],
};

describe("current-courier dragging", () => {
  it("draws a whole route in one drag", () => {
    const { container } = render(<CurrentCourier />);
    const grid = sizeTheMap(container);
    const path = ["A1", "B1", "C1", "C2", "C3", "B3", "A3"];
    const [sx, sy] = CENTRE[path[0]!]!;
    fireEvent.pointerDown(grid, { clientX: sx, clientY: sy, pointerId: 1 });
    for (const node of path.slice(1)) {
      const [x, y] = CENTRE[node]!;
      fireEvent.pointerMove(grid, { clientX: x, clientY: y, pointerId: 1 });
    }
    fireEvent.pointerUp(grid, { pointerId: 1 });
    expect(screen.getByText(/Route length: 6 \/ par 6/)).toBeTruthy();
    expect(screen.getByText(/Route complete/)).toBeTruthy();
  });

  it("ignores pointer movement before the drag has started", () => {
    const { container } = render(<CurrentCourier />);
    const grid = sizeTheMap(container);
    fireEvent.pointerMove(grid, { clientX: 150, clientY: 50, pointerId: 1 });
    expect(container.querySelector("svg polyline")).toBeNull();
  });

  it("rubs out the last leg when the drag doubles back", () => {
    const { container } = render(<CurrentCourier />);
    const grid = sizeTheMap(container);
    fireEvent.pointerDown(grid, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(grid, { clientX: 150, clientY: 50, pointerId: 1 });
    expect(container.querySelector("svg polyline")).not.toBeNull();
    fireEvent.pointerMove(grid, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(grid, { pointerId: 1 });
    expect(container.querySelector("svg polyline")).toBeNull();
  });

  it("will not drag through a street that does not exist", () => {
    const { container } = render(<CurrentCourier />);
    const grid = sizeTheMap(container);
    // A1 and C1 are not neighbours; the drag must not teleport across B1.
    fireEvent.pointerDown(grid, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(grid, { clientX: 250, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(grid, { pointerId: 1 });
    expect(container.querySelector("svg polyline")).toBeNull();
  });

  it("still numbers the route for keyboard players", () => {
    render(<CurrentCourier />);
    fireEvent.click(screen.getByRole("gridcell", { name: /^A1 stop/ }));
    expect(screen.getByRole("gridcell", { name: /^A1 stop route step 1/ })).toBeTruthy();
  });
});
