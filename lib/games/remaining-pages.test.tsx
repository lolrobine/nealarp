import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ColorMemory from "@/app/(experiences)/color-memory/page";
import WhichIsMore from "@/app/(experiences)/which-is-more/page";
import FormGame from "@/app/(experiences)/form-game/page";
import PackItPerfectly from "@/app/(experiences)/pack-it-perfectly/page";
import GravityGolf from "@/app/(experiences)/gravity-golf/page";
import TinyEcosystem from "@/app/(experiences)/tiny-ecosystem/page";
import OneSmallChange from "@/app/(experiences)/one-small-change/page";
import Dig from "@/app/(experiences)/how-deep-can-you-dig/page";
import { QUESTIONS } from "@/app/(experiences)/which-is-more/logic";
import { GOLF_LEVELS, simulateFlight } from "@/app/(experiences)/gravity-golf/logic";
import { LEVELS } from "@/app/(experiences)/pack-it-perfectly/logic";

const FORM_SOLUTION = [
  "Ada",
  "mint",
  "20+5",
  "Please let me apply for this permit.",
  "permit",
  "4",
  "A-42",
  "this form is not a sandwich",
  "TIMREP",
  "I authorize this authorization",
];
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("completes five memory rounds and records the result", () => {
  vi.useFakeTimers();
  render(<ColorMemory />);
  for (let i = 0; i < 5; i++) {
    fireEvent.click(screen.getByRole("button", { name: "Show color" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByLabelText("Neutral pause")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.change(screen.getByLabelText("Red", { exact: false }), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit color" }));
    if (i < 4) fireEvent.click(screen.getByRole("button", { name: "Next color" }));
  }
  expect(screen.getByText(/Final score:/)).toBeTruthy();
  expect(localStorage.getItem("nealarp:best:v1:color-memory:five-rounds")).not.toBeNull();
  expect(
    JSON.parse(localStorage.getItem("nealarp:progress:v1:color-memory:history")!).scores
  ).toHaveLength(1);
});
it("finishes the comparison quiz with all correct answers", () => {
  render(<WhichIsMore />);
  QUESTIONS.forEach((q, i) => {
    fireEvent.click(screen.getByRole("button", { name: q.a > q.b ? q.left : q.right }));
    if (i < 9) fireEvent.click(screen.getByRole("button", { name: "Next question" }));
  });
  expect(screen.getByText("Final score: 100.0 / 100")).toBeTruthy();
  expect(localStorage.getItem("nealarp:best:v1:which-is-more:all")).toBe("100");
  expect(localStorage.getItem("nealarp:best:v1:which-is-more:all:streak")).toBe("10");
});
it("practice mode remains playable and does not save a quiz record", () => {
  render(<WhichIsMore />);
  fireEvent.click(screen.getByRole("checkbox"));
  for (let i = 0; i < 11; i++) {
    const q = QUESTIONS[i % 10]!;
    fireEvent.click(screen.getByRole("button", { name: q.left }));
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
  }
  expect(screen.queryByText(/Final score:/)).toBeNull();
  expect(localStorage.getItem("nealarp:best:v1:which-is-more:all")).toBeNull();
});
it("validates, restores and completes all form approvals", () => {
  const first = render(<FormGame />);
  fireEvent.change(screen.getByLabelText(/Enter your first name/), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Request approval" }));
  expect(screen.getByRole("alert").textContent).toContain("cannot approve");
  for (let i = 0; i < 3; i++) {
    fireEvent.change(screen.getByRole("textbox"), { target: { value: FORM_SOLUTION[i] } });
    fireEvent.click(screen.getByRole("button", { name: "Request approval" }));
  }
  first.unmount();
  render(<FormGame />);
  expect(screen.getByText("3 / 10 approvals")).toBeTruthy();
  for (let i = 3; i < 10; i++) {
    fireEvent.change(screen.getByRole("textbox"), { target: { value: FORM_SOLUTION[i] } });
    fireEvent.click(screen.getByRole("button", { name: "Request approval" }));
  }
  expect(screen.getByRole("heading", { name: "Permit granted!" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reset form and saved answers" }));
  expect(screen.getByText("0 / 10 approvals")).toBeTruthy();
});
it("can finish the form when a previously working store starts rejecting writes", () => {
  localStorage.setItem("nealarp:progress:v1:form-game", JSON.stringify({ answers: ["Ada"] }));
  render(<FormGame />);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "mint" } });
  fireEvent.click(screen.getByRole("button", { name: "Request approval" }));
  expect(screen.getByText("2 / 10 approvals")).toBeTruthy();
  expect(screen.getByText(/Storage is unavailable/)).toBeTruthy();
});
it("packs a complete suitcase and resets the board", () => {
  render(<PackItPerfectly />);
  for (const p of LEVELS[0]!.solution) {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Piece ${p.id}`) }));
    fireEvent.click(
      screen.getByRole("button", { name: `Row ${p.y + 1}, column ${p.x + 1}, empty` })
    );
  }
  expect(screen.getByRole("status").textContent).toContain("Perfectly packed!");
  expect(localStorage.getItem("nealarp:best:v1:pack-it-perfectly:level-0")).toBe("100");
  fireEvent.click(screen.getByRole("button", { name: "Restart level" }));
  expect(screen.getByRole("button", { name: "Row 1, column 1, empty" })).toBeTruthy();
});
it("launches a winning golf shot and stores its level record", () => {
  render(<GravityGolf />);
  let solution: { angle: number; power: number } | null = null;
  for (let a = 15; a <= 45 && !solution; a += 0.5)
    for (let p = 100; p <= 220; p += 5)
      if (simulateFlight(GOLF_LEVELS[0]!, a, p).outcome === "goal") {
        solution = { angle: a, power: p };
        break;
      }
  expect(solution).not.toBeNull();
  fireEvent.change(screen.getByLabelText(/Launch angle/), {
    target: { value: String(solution!.angle) },
  });
  fireEvent.change(screen.getByLabelText(/Launch power/), {
    target: { value: String(solution!.power) },
  });
  fireEvent.click(screen.getByRole("button", { name: "Launch ball" }));
  expect(screen.getByRole("status").textContent).toContain("Goal!");
  expect(localStorage.getItem("nealarp:best:v1:gravity-golf:level-0:gravity-v2")).toBe("100");
});
it("survives twelve ecosystem rounds and restarts", () => {
  render(<TinyEcosystem />);
  for (let i = 0; i < 12; i++)
    fireEvent.click(screen.getByRole("button", { name: "Advance round" }));
  expect(screen.getByRole("status").textContent).toContain("Twelve rounds of balance!");
  expect(localStorage.getItem("nealarp:best:v1:tiny-ecosystem:survival")).toBe("100");
  fireEvent.click(screen.getByRole("button", { name: "Restart ecosystem" }));
  expect(screen.getByText(/Round 0 \/ 12/)).toBeTruthy();
});
it("runs and resets a one-parameter experiment", () => {
  render(<OneSmallChange />);
  fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));
  expect(screen.getByRole("heading", { name: "Experiment complete" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/Restitution coefficient/), { target: { value: "0.9" } });
  expect(screen.getByText(/Settings changed/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reset experiment" }));
  expect(screen.queryByRole("heading", { name: "Experiment complete" })).toBeNull();
});
it("unlocks all discoveries, restores the journey and resets it", () => {
  const first = render(<Dig />);
  for (let i = 0; i < 7; i++)
    fireEvent.click(screen.getByRole("button", { name: "Dig to next discovery" }));
  expect(screen.getByRole("status").textContent).toContain("Journey complete!");
  first.unmount();
  render(<Dig />);
  expect(screen.getByText("8 / 8 discoveries")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reset journey and saved discoveries" }));
  expect(screen.getByText("1 / 8 discoveries")).toBeTruthy();
});

it("the direct color mixer updates all three channel sliders", () => {
  vi.useFakeTimers();
  render(<ColorMemory />);
  fireEvent.click(screen.getByRole("button", { name: "Show color" }));
  act(() => vi.advanceTimersByTime(3000));
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.change(screen.getByLabelText("Mix a color"), { target: { value: "#1e64c8" } });
  expect((screen.getByLabelText(/^Red/) as HTMLInputElement).value).toBe("30");
  expect((screen.getByLabelText(/^Green/) as HTMLInputElement).value).toBe("100");
  expect((screen.getByLabelText(/^Blue/) as HTMLInputElement).value).toBe("200");
});
