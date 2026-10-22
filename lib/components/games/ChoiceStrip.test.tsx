import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChoiceStrip } from "./ChoiceStrip";

function renderStrip() {
  const view = render(
    <ChoiceStrip label="Levels">
      <button type="button">1. First</button>
      <button type="button">2. Second</button>
    </ChoiceStrip>
  );
  const strip = screen.getByRole("group", { name: "Levels" });
  return { ...view, strip };
}

/** jsdom does no layout, so overflow has to be declared rather than measured. */
function makeItOverflow(strip: HTMLElement, scrollLeft = 0) {
  Object.defineProperty(strip, "scrollWidth", { value: 800, configurable: true });
  Object.defineProperty(strip, "clientWidth", { value: 320, configurable: true });
  Object.defineProperty(strip, "scrollLeft", { value: scrollLeft, configurable: true });
  fireEvent.scroll(strip);
}

describe("ChoiceStrip", () => {
  it("keeps the buttons it is given, with their labels intact", () => {
    renderStrip();
    expect(screen.getByRole("button", { name: "1. First" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2. Second" })).toBeTruthy();
  });

  it("scrolls sideways rather than wrapping onto new rows", () => {
    const { strip } = renderStrip();
    expect(strip.className).toContain("overflow-x-auto");
    expect(strip.className).not.toContain("flex-wrap");
  });

  it("offers no arrows while everything already fits", () => {
    renderStrip();
    expect(screen.queryByRole("button", { name: /^Scroll levels/ })).toBeNull();
  });

  it("offers a right arrow once there is more to the right", () => {
    const { strip } = renderStrip();
    makeItOverflow(strip);
    expect(screen.getByRole("button", { name: "Scroll levels right" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Scroll levels left" })).toBeNull();
  });

  it("offers a left arrow once the strip has been scrolled", () => {
    const { strip } = renderStrip();
    makeItOverflow(strip, 200);
    expect(screen.getByRole("button", { name: "Scroll levels left" })).toBeTruthy();
  });

  it("names the arrows after whatever the strip holds", () => {
    render(
      <ChoiceStrip label="Rooms">
        <button type="button">1. Hall</button>
      </ChoiceStrip>
    );
    const strip = screen.getByRole("group", { name: "Rooms" });
    makeItOverflow(strip);
    expect(screen.getByRole("button", { name: "Scroll rooms right" })).toBeTruthy();
  });

  it("survives a browser without scrollBy instead of throwing", () => {
    const { strip } = renderStrip();
    makeItOverflow(strip);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Scroll levels right" }))
    ).not.toThrow();
  });
});
