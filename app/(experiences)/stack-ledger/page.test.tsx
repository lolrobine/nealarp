import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StackLedger from "./page";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

/** Drops the bar and lets the landing animation finish. */
function drop() {
  fireEvent.click(screen.getByRole("button", { name: "Drop bar" }));
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

describe("stack-ledger announcements", () => {
  it("starts with an empty status line rather than a stale message", () => {
    render(<StackLedger />);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("says out loud what the tumbling animation shows", () => {
    render(<StackLedger />);
    drop();
    const status = screen.getByRole("status");
    // Either a clean landing or a count of lost cells, plus the new height.
    expect(status.textContent).toMatch(/Clean landing|cells? snapped off/);
    expect(status.textContent).toMatch(/Tallest column \d+ of 20/);
  });

  it("keeps the status polite so it never interrupts the player", () => {
    render(<StackLedger />);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });

  it("updates again on the next drop", () => {
    render(<StackLedger />);
    drop();
    const first = screen.getByRole("status").textContent;
    drop();
    const second = screen.getByRole("status").textContent;
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
  });
});

describe("stack-ledger drops where the bar is", () => {
  /** Reads the skyline out of the DOM: which columns actually hold blocks. */
  function filledColumns(container: HTMLElement): number[] {
    return Array.from(container.querySelectorAll("[data-col]"))
      .filter((el) => Number(el.getAttribute("data-height")) > 0)
      .map((el) => Number(el.getAttribute("data-col")));
  }

  it("lands under the sliding bar, not on column 0", () => {
    const { container } = render(<StackLedger />);
    // Let the rAF loop carry the bar away from its starting column.
    act(() => {
      vi.advanceTimersByTime(600);
    });
    const bar = container.querySelector("#sl-bar") as HTMLElement | null;
    expect(bar, "the moving bar should be on screen").not.toBeNull();
    const leftPct = parseFloat(bar!.style.left);
    expect(leftPct, "bar never moved, so this test proves nothing").toBeGreaterThan(0);

    drop();

    const filled = filledColumns(container);
    expect(filled.length).toBeGreaterThan(0);
    // The block must sit under the bar. Before the fix every drop landed on 0
    // because doDrop read a state.x that the rAF loop never updated.
    const expectedCol = Math.round((leftPct / 100) * 11);
    expect(filled).toContain(expectedCol);
  });

  it("honours an arrow-key nudge instead of snapping back", () => {
    const { container } = render(<StackLedger />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    drop();
    expect(filledColumns(container)).toContain(2);
  });
});
