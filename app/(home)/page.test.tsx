import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}));

import Home from "./page";
import { getLiveExperiences } from "@/lib/registry/experiences";

const TOTAL = getLiveExperiences().length;

// jsdom does not implement scrollIntoView; the catalogue uses it to keep the
// keyboard-focused card in view.
beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

const search = () => screen.getByLabelText("Search experiences");

describe("catalogue", () => {
  it("announces the full count before anything is filtered", () => {
    render(<Home />);
    expect(screen.getByRole("status").textContent).toBe(`Showing all ${TOTAL} experiences`);
  });

  it("keeps the count announcement polite", () => {
    render(<Home />);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });

  it("reports a narrowed result set when searching", () => {
    render(<Home />);
    fireEvent.change(search(), { target: { value: "sand" } });
    const text = screen.getByRole("status").textContent ?? "";
    expect(text).toMatch(new RegExp(`^\\d+ of ${TOTAL} experiences match$`));
    const shown = Number(text.split(" ")[0]);
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(TOTAL);
  });

  it("reports zero and offers a way out when nothing matches", () => {
    render(<Home />);
    fireEvent.change(search(), { target: { value: "zzzzzznotagame" } });
    expect(screen.getByRole("status").textContent).toBe(`0 of ${TOTAL} experiences match`);
    expect(screen.getByRole("button", { name: /Clear filters/ })).toBeTruthy();
  });

  it("recovers the full list after clearing the filters", () => {
    render(<Home />);
    fireEvent.change(search(), { target: { value: "zzzzzznotagame" } });
    fireEvent.click(screen.getByRole("button", { name: /Clear filters/ }));
    expect(screen.getByRole("status").textContent).toBe(`Showing all ${TOTAL} experiences`);
  });
});

describe("home filter strip", () => {
  it("shows a scroll arrow only once the categories overflow", () => {
    const { container } = render(<Home />);
    expect(screen.queryByRole("button", { name: "Scroll filters right" })).toBeNull();

    // jsdom lays nothing out, so the overflow has to be declared.
    const strip = container.querySelector(".overflow-x-auto") as HTMLElement;
    expect(strip).toBeTruthy();
    Object.defineProperty(strip, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(strip, "clientWidth", { value: 320, configurable: true });
    fireEvent.scroll(strip);

    expect(screen.getByRole("button", { name: "Scroll filters right" })).toBeTruthy();
    // Nothing is scrolled off to the left yet, so that arrow stays hidden.
    expect(screen.queryByRole("button", { name: "Scroll filters left" })).toBeNull();
  });
});
