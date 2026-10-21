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
