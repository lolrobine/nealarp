import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Dig from "./page";
import { DIG_SITES } from "./data";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const jumpBox = () => screen.getByLabelText("Jump to a discovered depth") as HTMLSelectElement;
const digButton = () => screen.getByRole("button", { name: "Dig to next discovery" });

describe("how-deep-can-you-dig", () => {
  /**
   * The select used to sit inside its label with no htmlFor. A control embedded in a label
   * contributes its *value* to the accessible name, so it announced itself as "Jump to a
   * discovered depth 0 km · Surface" and the name changed every time the player chose a
   * different depth. The label is attached by id now, so the name is the question alone.
   */
  it("names the jump control after the question, not after the answer", () => {
    render(<Dig />);
    const select = jumpBox();
    const label = select.labels?.[0];
    expect(label, "the select needs a label attached by id").toBeTruthy();
    // getByLabelText is happy either way, so it is not enough on its own: assert the label
    // sits outside the control and reads as the question alone.
    expect(label!.contains(select)).toBe(false);
    expect(label!.textContent?.trim()).toBe("Jump to a discovered depth");
  });

  it("starts at the surface with one discovery and nothing else offered", () => {
    render(<Dig />);
    expect(screen.getByText(`1 / ${DIG_SITES.length} discoveries`)).toBeTruthy();
    expect(within(jumpBox()).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(DIG_SITES[0]!.name);
  });

  it("offers exactly the depths already reached, never the ones ahead", () => {
    render(<Dig />);
    for (let dug = 1; dug < DIG_SITES.length; dug += 1) {
      fireEvent.click(digButton());
      expect(screen.getByText(`${dug + 1} / ${DIG_SITES.length} discoveries`)).toBeTruthy();
      const offered = within(jumpBox())
        .getAllByRole("option")
        .map((option) => option.textContent);
      expect(offered).toHaveLength(dug + 1);
      expect(offered[dug]).toContain(DIG_SITES[dug]!.name);
    }
  });

  it("stops digging at the centre instead of running past the list", () => {
    render(<Dig />);
    for (let i = 0; i < DIG_SITES.length - 1; i += 1) fireEvent.click(digButton());
    expect((digButton() as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("Journey complete");
  });

  it("revisits an earlier depth without giving the progress back", () => {
    render(<Dig />);
    fireEvent.click(digButton());
    fireEvent.click(digButton());
    fireEvent.change(jumpBox(), { target: { value: "0" } });

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(DIG_SITES[0]!.name);
    // Revisiting is not un-digging: all three stay on offer.
    expect(screen.getByText(`3 / ${DIG_SITES.length} discoveries`)).toBeTruthy();
    expect(within(jumpBox()).getAllByRole("option")).toHaveLength(3);
  });

  it("puts the journey back to the surface when reset", () => {
    render(<Dig />);
    fireEvent.click(digButton());
    fireEvent.click(digButton());
    fireEvent.click(screen.getByRole("button", { name: /Reset journey/ }));

    expect(screen.getByText(`1 / ${DIG_SITES.length} discoveries`)).toBeTruthy();
    expect(within(jumpBox()).getAllByRole("option")).toHaveLength(1);
    expect((digButton() as HTMLButtonElement).disabled).toBe(false);
  });
});
