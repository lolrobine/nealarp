import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { playbackFraction, usePlayback } from "./usePlayback";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("presentation playback", () => {
  it("clamps progress and prevents division by zero", () => {
    expect(playbackFraction(-20, 1000)).toBe(0);
    expect(playbackFraction(500, 1000)).toBe(0.5);
    expect(playbackFraction(2000, 1000)).toBe(1);
    expect(playbackFraction(10, 0)).toBe(1);
  });
  it("plays, pauses, seeks, resumes, completes and cleans up", () => {
    let callback: FrameRequestCallback = () => {};
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      callback = cb;
      return 42;
    });
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const { result, unmount } = renderHook(() => usePlayback());
    act(() => result.current.play(1000));
    act(() => callback(500));
    expect(result.current.progress).toBe(0.5);
    act(() => result.current.pause());
    expect(result.current.running).toBe(false);
    expect(cancel).toHaveBeenCalledWith(42);
    act(() => result.current.seek(0.25));
    expect(result.current.progress).toBe(0.25);
    now = 1000;
    act(() => result.current.resume());
    act(() => callback(1750));
    expect(result.current.progress).toBe(1);
    expect(result.current.running).toBe(false);
    act(() => result.current.play(500));
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
  it("does not auto-animate in reduced-motion mode", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    const { result } = renderHook(() => usePlayback());
    act(() => result.current.play(8000));
    expect(result.current.progress).toBe(1);
    expect(result.current.running).toBe(false);
    act(() => result.current.seek(0.5));
    expect(result.current.progress).toBe(0.5);
    act(() => result.current.resume());
    expect(result.current.running).toBe(false);
    expect(result.current.progress).toBe(1);
  });
});
