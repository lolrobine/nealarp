import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act as reactAct } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import BlockTalkPage from "./page";
import { generatePattern } from "./logic";

const FIXED_NOW = 1_700_000_000_000;
const SEED = `block-talk:${FIXED_NOW}`;

function setMotionPreference(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reduce : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

const cell = (name: string) => screen.getByRole("button", { name });

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "matchMedia");
  localStorage.clear();
});

describe("block-talk and reduced motion", () => {
  it("does not flash the opening pattern at someone who asked it not to", () => {
    // The preference used to be read into useState at mount, when the media
    // query hook still reports its server default, so round one flashed.
    setMotionPreference(true);
    render(<BlockTalkPage />);
    expect((cell("Hide now") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Start rebuilding" })).toBeTruthy();
  });

  it("honours the preference through a real hydration, not just a fresh mount", async () => {
    // This is the shape of the original bug and a plain render cannot show it.
    // On the server the media query hook has to answer with its default, so
    // useState(reducedMotion) captured false; the corrected value only arrives
    // after hydration, and state seeded once never hears about it.
    setMotionPreference(true);
    const container = document.createElement("div");
    container.innerHTML = renderToString(<BlockTalkPage />);
    document.body.appendChild(container);

    await reactAct(async () => {
      hydrateRoot(container, <BlockTalkPage />);
    });

    const hideNow = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Hide now"
    );
    expect(hideNow?.disabled).toBe(true);
    container.remove();
  });

  it("still flashes for everyone else, then hides on its own", () => {
    setMotionPreference(false);
    vi.useFakeTimers();
    try {
      render(<BlockTalkPage />);
      expect((cell("Hide now") as HTMLButtonElement).disabled).toBe(false);
      expect(screen.queryByRole("button", { name: "Start rebuilding" })).toBeNull();

      act(() => void vi.advanceTimersByTime(4000));

      expect(screen.getByRole("button", { name: "Start rebuilding" })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("block-talk cells say what they are", () => {
  it("names the cells of the pattern while it is on show", () => {
    setMotionPreference(false);
    render(<BlockTalkPage />);
    const pattern = generatePattern(SEED, 0);
    for (const id of pattern) expect(cell(`${id} filled`)).toBeTruthy();
    expect(pattern.length).toBeGreaterThanOrEqual(3);
  });

  it("names a miss and a stray without relying on their colour", () => {
    setMotionPreference(true);
    render(<BlockTalkPage />);
    const pattern = generatePattern(SEED, 0);
    const stray = ["A1", "A2", "A3", "A4", "B1"].find((id) => !pattern.includes(id))!;

    fireEvent.click(screen.getByRole("button", { name: "Start rebuilding" }));
    fireEvent.click(cell(stray));
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(cell(`${stray} should have stayed empty`)).toBeTruthy();
    expect(cell(`${pattern[0]} missed`)).toBeTruthy();
  });

  it("marks the grid as a group rather than an incomplete table", () => {
    setMotionPreference(true);
    render(<BlockTalkPage />);
    // A role="grid" whose cells are not wrapped in rows is a broken grid.
    expect(screen.getByRole("group", { name: "A1 to D4 block grid" })).toBeTruthy();
    expect(screen.queryAllByRole("gridcell")).toHaveLength(0);
  });
});

describe("block-talk scoring", () => {
  function rebuild(cells: string[]) {
    fireEvent.click(screen.getByRole("button", { name: "Start rebuilding" }));
    for (const id of cells) fireEvent.click(cell(id));
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
  }

  it("banks a perfect rebuild without a separate save button", () => {
    setMotionPreference(true);
    render(<BlockTalkPage />);
    rebuild(generatePattern(SEED, 0));

    expect(screen.queryByRole("button", { name: "Save score" })).toBeNull();
    expect(localStorage.getItem("nealarp:best:v1:block-talk")).toBe("100");
  });

  it("scores a partial rebuild by how much the two grids agree", () => {
    setMotionPreference(true);
    render(<BlockTalkPage />);
    const pattern = generatePattern(SEED, 0);
    rebuild(pattern.slice(0, pattern.length - 1));

    const shared = pattern.length - 1;
    const expected = String(Math.round((shared / pattern.length) * 100));
    expect(localStorage.getItem("nealarp:best:v1:block-talk")).toBe(expected);
    expect(screen.getByText(`Overlap ${expected}%`)).toBeTruthy();
  });
});
