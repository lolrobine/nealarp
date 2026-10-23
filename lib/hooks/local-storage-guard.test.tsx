import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

/**
 * Storage is shared with every older version of this site the browser has
 * ever loaded, so a value read back is a claim about its type and not
 * proof of it. useStoredValue has always demanded a guard; this hook used
 * to cast and hope, which is how Pocket Sand could take a brush material
 * straight from storage and stamp a number the simulation does not
 * recognise into the grid — a cell that never falls and never counts
 * toward the goal, with no way to clear it but a reset.
 */

const KEY = "nealarp:test:v1:speed";
const ALLOWED = ["slow", "normal", "fast"];
const isSpeed = (value: unknown): value is string =>
  typeof value === "string" && ALLOWED.includes(value);

function Probe() {
  const [speed] = useLocalStorage<string>(KEY, "normal", isSpeed);
  return <span data-testid="speed">{speed}</span>;
}

function shown() {
  return screen.getByTestId("speed").textContent;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("stored settings are checked before they are trusted", () => {
  it("keeps a stored value the guard accepts", () => {
    localStorage.setItem(KEY, JSON.stringify("fast"));
    render(<Probe />);
    expect(shown()).toBe("fast");
  });

  it("falls back to the default when the stored value is not one of the options", () => {
    // Exactly what an older build leaves behind after an option is renamed.
    localStorage.setItem(KEY, JSON.stringify("blisteringly-quick"));
    render(<Probe />);
    expect(shown()).toBe("normal");
  });

  it("falls back when the stored value is the wrong type entirely", () => {
    localStorage.setItem(KEY, JSON.stringify({ speed: "fast" }));
    render(<Probe />);
    expect(shown()).toBe("normal");
  });

  it("falls back when the stored text is not JSON at all", () => {
    localStorage.setItem(KEY, "{definitely not json");
    render(<Probe />);
    expect(shown()).toBe("normal");
  });

  it("checks another tab's value too, rather than trusting it", () => {
    render(<Probe />);
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: KEY, newValue: JSON.stringify("nonsense") })
      );
    });
    expect(shown()).toBe("normal");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: KEY, newValue: JSON.stringify("slow") })
      );
    });
    expect(shown()).toBe("slow");
  });

  it("returns to the default when another tab clears the key", () => {
    localStorage.setItem(KEY, JSON.stringify("fast"));
    render(<Probe />);
    expect(shown()).toBe("fast");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: null }));
    });
    expect(shown()).toBe("normal");
  });
});
