import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import OrbitOrchard from "./page";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("orbit-orchard hint marker", () => {
  it("offers a hint toggle that starts hidden", () => {
    render(<OrbitOrchard />);
    const button = screen.getByRole("button", { name: "Show hint direction" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("shows the marker without aiming or firing for the player", () => {
    render(<OrbitOrchard />);
    const slider = screen.getByLabelText(/Launch angle/);
    const before = (slider as HTMLInputElement).value;
    fireEvent.click(screen.getByRole("button", { name: "Show hint direction" }));
    expect(screen.getByRole("button", { name: "Hide hint direction" })).toBeTruthy();
    // The hint is a marker only: it must not move the aim or record a score.
    expect((screen.getByLabelText(/Launch angle/) as HTMLInputElement).value).toBe(before);
    expect(localStorage.getItem("nealarp:best:v1:orbit-orchard")).toBeNull();
  });

  it("toggles back off", () => {
    render(<OrbitOrchard />);
    fireEvent.click(screen.getByRole("button", { name: "Show hint direction" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide hint direction" }));
    expect(screen.getByRole("button", { name: "Show hint direction" })).toBeTruthy();
  });
});

describe("orbit-orchard flight", () => {
  const replayButton = () => screen.getByRole("button", { name: "Replay flight" });

  it("keeps the outcome hidden until a seed has actually been launched", () => {
    render(<OrbitOrchard />);
    expect(screen.getByText(/launch to find out/)).toBeTruthy();
    expect(screen.queryByText(/Rings threaded/)).toBeNull();
  });

  it("offers a replay only once there is a flight to replay", () => {
    render(<OrbitOrchard />);
    expect(replayButton().hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Launch seed" }));
    expect(replayButton().hasAttribute("disabled")).toBe(false);
  });

  it("reports the outcome after the flight has played out", () => {
    render(<OrbitOrchard />);
    fireEvent.click(screen.getByRole("button", { name: "Launch seed" }));
    // Reduced motion is the default in jsdom, so the flight resolves at once.
    expect(screen.getByText(/Rings threaded/)).toBeTruthy();
  });

  it("drops the old flight when the aim changes", () => {
    render(<OrbitOrchard />);
    fireEvent.click(screen.getByRole("button", { name: "Launch seed" }));
    fireEvent.change(screen.getByLabelText(/Launch angle/), { target: { value: "20" } });
    expect(screen.getByText(/launch to find out/)).toBeTruthy();
    expect(replayButton().hasAttribute("disabled")).toBe(true);
  });
});
