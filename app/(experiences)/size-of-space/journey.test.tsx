import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Page from "./page";

/**
 * The journey drives a twenty-second pan across every order of magnitude
 * with a sine zoom pulse on top, looping until you stop it. That is the
 * feature, so it cannot simply be switched off — but a continuous
 * auto-zoom is also exactly what prefers-reduced-motion exists to stop,
 * and a requestAnimationFrame loop never sees the rule in globals.css.
 *
 * The compromise is that reduced motion gets the tour without the
 * travelling: it holds on one object, then the next.
 */

function setReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe("the journey respects reduced motion", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame");
  });

  it("does not start a continuous animation when the player asked for less motion", () => {
    setReducedMotion(true);
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /journey/i }));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("still animates continuously by default", () => {
    setReducedMotion(false);
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /journey/i }));
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it("still tours the objects, one held still at a time", () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /journey/i }));

    const seen = new Set<string>();
    for (let step = 0; step < 4; step++) {
      act(() => {
        vi.advanceTimersByTime(2200);
      });
      // The position label mirrors zoomCenter, which each step moves to the
      // object it is holding on.
      const position = document.querySelector('label[for="sos-position"]')?.textContent;
      if (position) seen.add(position);
    }
    // Stepping, not standing still: the tour moved on at least once.
    expect(seen.size).toBeGreaterThan(1);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
});
