import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import TinyEcosystem from "./page";
import { INITIAL_ECOSYSTEM } from "./logic";

/** Derived from the opening position rather than hardcoded, so rebalancing
 *  the start does not silently turn this into a test of nothing. */
const START = INITIAL_ECOSYSTEM;
afterEach(cleanup);
it("places bushes and animals with an accessible non-drag alternative and resets the world", () => {
  render(<TinyEcosystem />);
  fireEvent.click(screen.getByRole("button", { name: "Drag bush into habitat" }));
  fireEvent.click(screen.getByRole("button", { name: "Place selected in habitat" }));
  expect(screen.getByRole("meter", { name: "Plants" }).getAttribute("value")).toBe(
    String(START.plants + 10)
  );
  fireEvent.click(screen.getByRole("button", { name: "Drag rabbit into habitat" }));
  fireEvent.click(screen.getByRole("button", { name: "Place selected in habitat" }));
  expect(screen.getByRole("meter", { name: "Herbivores" }).getAttribute("value")).toBe(
    String(START.herbivores + 1)
  );
  expect(
    screen.getByRole("button", { name: "Place selected in habitat" }).hasAttribute("disabled")
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Restart ecosystem" }));
  expect(screen.getByRole("meter", { name: "Herbivores" }).getAttribute("value")).toBe(
    String(START.herbivores)
  );
  expect(
    screen.getByRole("button", { name: "Place selected in habitat" }).hasAttribute("disabled")
  ).toBe(false);
});
