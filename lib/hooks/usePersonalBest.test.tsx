import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePersonalBest } from "./usePersonalBest";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("personal records", () => {
  it("persists improvements, rejects regressions and resets", () => {
    const { result } = renderHook(() => usePersonalBest("test"));
    act(() => result.current.save(80));
    act(() => result.current.save(50));
    expect(result.current.best).toBe(80);
    act(() => result.current.clear());
    expect(result.current.best).toBeNull();
  });
  it("ignores corrupt records and handles unavailable storage", () => {
    localStorage.setItem("nealarp:best:v1:test", "not a score");
    const { result } = renderHook(() => usePersonalBest("test"));
    expect(result.current.best).toBeNull();
    act(() => result.current.save(75));
    expect(result.current.best).toBe(75);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    act(() => result.current.save(90));
    expect(result.current.unavailable).toBe(true);
  });
});
