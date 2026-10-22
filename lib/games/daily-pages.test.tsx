import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import WhichIsMore from "@/app/(experiences)/which-is-more/page";
import ColorMemory from "@/app/(experiences)/color-memory/page";
import { dailyQuestions } from "@/app/(experiences)/which-is-more/logic";
import { localDayKey } from "./daily";
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("stores the daily quiz independently and resets its badges with its record", () => {
  render(<WhichIsMore />);
  const day = localDayKey();
  fireEvent.click(screen.getByRole("radio", { name: "Play today's challenge" }));
  const questions = dailyQuestions(day);
  questions.forEach((q, i) => {
    fireEvent.click(screen.getByRole("button", { name: q.a > q.b ? q.left : q.right }));
    if (i < 9) fireEvent.click(screen.getByRole("button", { name: "Next question" }));
  });
  expect(localStorage.getItem(`nealarp:best:v1:which-is-more:daily:${day}:v1`)).toBe("100");
  expect(localStorage.getItem("nealarp:best:v1:which-is-more:all")).toBeNull();
  expect(screen.getByLabelText("Perfect unlocked")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reset personal best" }));
  expect(screen.getByLabelText("Perfect locked")).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "Standard quiz" }));
  expect(screen.getByText("No completed attempt yet.")).toBeTruthy();
});
it("pins the daily color session across midnight and leaves standard history alone", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16, 23, 59));
  render(<ColorMemory />);
  fireEvent.click(screen.getByRole("radio", { name: "Play today's challenge" }));
  vi.setSystemTime(new Date(2026, 9, 17, 0, 1));
  for (let i = 0; i < 5; i++) {
    fireEvent.click(screen.getByRole("button", { name: "Show color" }));
    act(() => vi.advanceTimersByTime(3000));
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole("button", { name: "Submit color" }));
    if (i < 4) fireEvent.click(screen.getByRole("button", { name: "Next color" }));
  }
  expect(localStorage.getItem("nealarp:best:v1:color-memory:daily:2026-10-16:v1")).not.toBeNull();
  expect(localStorage.getItem("nealarp:best:v1:color-memory:five-rounds")).toBeNull();
  expect(localStorage.getItem("nealarp:progress:v1:color-memory:history")).toBeNull();
});
