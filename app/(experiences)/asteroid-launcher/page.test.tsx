import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AsteroidLauncher from "./page";

afterEach(cleanup);

/** The page opens on country maps, so the first one on screen is the one to drive. */
const launchSite = () => screen.getByRole("button", { name: /^Launch site in USA/ });

/** Read the crosshair position back out of the button's label. */
function aim(): { lat: number; lng: number } {
  const label = launchSite().getAttribute("aria-label") ?? "";
  const parsed = /([\d.]+) degrees (north|south), ([\d.]+) degrees (east|west)/.exec(label);
  if (!parsed) throw new Error(`no coordinates in label: ${label}`);
  return {
    lat: Number(parsed[1]) * (parsed[2] === "north" ? 1 : -1),
    lng: Number(parsed[3]) * (parsed[4] === "east" ? 1 : -1),
  };
}

const press = (key: string, shiftKey = false) => fireEvent.keyDown(launchSite(), { key, shiftKey });

/**
 * The map used to be a bare div carrying onClick and aria-hidden, so the one verb this game
 * has - drop an asteroid somewhere - was reachable with a mouse and nothing else. These cover
 * the keyboard route end to end. Testing Library's fireEvent.click reports detail 0, which is
 * what Enter on a focused button produces, so it exercises the real branch rather than a stub.
 */
describe("asteroid-launcher keyboard parity", () => {
  it("exposes the map as a focusable, named control", () => {
    render(<AsteroidLauncher />);
    const site = launchSite();
    expect(site.tagName).toBe("BUTTON");
    expect(site.getAttribute("aria-hidden")).toBeNull();
    expect(site.getAttribute("aria-label")).toContain("Arrow keys move the crosshair");
  });

  it("moves the crosshair with the arrow keys and says where it went", () => {
    render(<AsteroidLauncher />);
    const start = aim();

    press("ArrowRight");
    expect(aim().lng).toBeGreaterThan(start.lng);
    expect(aim().lat).toBe(start.lat);

    press("ArrowUp");
    expect(aim().lat).toBeGreaterThan(start.lat);
  });

  it("treats Shift as the fine step", () => {
    render(<AsteroidLauncher />);
    const start = aim().lng;
    press("ArrowRight", true);
    const fine = aim().lng - start;
    press("ArrowRight");
    const coarse = aim().lng - start - fine;
    expect(fine).toBeGreaterThan(0);
    expect(coarse).toBeGreaterThan(fine);
  });

  it("stops at the edge of the frame instead of running off it", () => {
    render(<AsteroidLauncher />);
    for (let i = 0; i < 30; i += 1) press("ArrowUp");
    const atEdge = aim();
    press("ArrowUp");
    expect(aim()).toEqual(atEdge);
  });

  it("launches from the keyboard and names the impact it adds", () => {
    render(<AsteroidLauncher />);
    expect(screen.queryByRole("checkbox", { name: "Compare impact 1" })).toBeNull();

    press("ArrowDown");
    fireEvent.click(launchSite()); // detail 0 - the Enter path

    expect(screen.getByRole("checkbox", { name: "Compare impact 1" })).toBeTruthy();
  });
});
