import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useResolvedTheme } from "./useResolvedTheme";
import { useThemeStore } from "@/lib/store/theme";
import { useStoredValue } from "./useSavedProgress";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useThemeStore.setState({ theme: "system" });
  localStorage.clear();
});
function mediaQueries() {
  const queries = new Map<string, { matches: boolean; listeners: Set<() => void> }>();
  vi.stubGlobal("matchMedia", (query: string) => {
    if (!queries.has(query)) queries.set(query, { matches: false, listeners: new Set() });
    const state = queries.get(query)!;
    return {
      get matches() {
        return state.matches;
      },
      addEventListener: (_: string, listener: () => void) => state.listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => state.listeners.delete(listener),
    };
  });
  return {
    change(query: string, matches: boolean) {
      const state = queries.get(query)!;
      act(() => {
        state.matches = matches;
        state.listeners.forEach((listener) => listener());
      });
    },
    listeners(query: string) {
      return queries.get(query)!.listeners.size;
    },
  };
}
it("tracks media changes, switches queries, and removes listeners", () => {
  const media = mediaQueries();
  const { result, rerender, unmount } = renderHook(({ query }) => useMediaQuery(query), {
    initialProps: { query: "(min-width: 600px)" },
  });
  expect(result.current).toBe(false);
  media.change("(min-width: 600px)", true);
  expect(result.current).toBe(true);
  rerender({ query: "(min-width: 900px)" });
  expect(result.current).toBe(false);
  expect(media.listeners("(min-width: 600px)")).toBe(0);
  unmount();
  expect(media.listeners("(min-width: 900px)")).toBe(0);
});
it("tracks reduced motion and resolves explicit themes independently of the OS", () => {
  const media = mediaQueries();
  const { result } = renderHook(() => ({
    reduced: usePrefersReducedMotion(),
    theme: useResolvedTheme(),
  }));
  media.change("(prefers-reduced-motion: reduce)", true);
  expect(result.current.reduced).toBe(true);
  media.change("(prefers-color-scheme: dark)", true);
  expect(result.current.theme).toBe("dark");
  act(() => useThemeStore.getState().setTheme("light"));
  expect(result.current.theme).toBe("light");
  media.change("(prefers-color-scheme: dark)", false);
  expect(result.current.theme).toBe("light");
});
it("loads existing legacy storage keys and observes storage events", () => {
  localStorage.setItem("perfect-circle-best", "97");
  const valid = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
  const { result } = renderHook(() => useStoredValue("perfect-circle-best", 0, valid));
  expect(result.current.value).toBe(97);
  act(() => result.current.save(99));
  expect(localStorage.getItem("perfect-circle-best")).toBe("99");
  act(() => {
    localStorage.setItem("perfect-circle-best", "100");
    window.dispatchEvent(new StorageEvent("storage", { key: "perfect-circle-best" }));
  });
  expect(result.current.value).toBe(100);
  act(() => {
    localStorage.setItem("perfect-circle-best", "garbage");
    window.dispatchEvent(new StorageEvent("storage"));
  });
  expect(result.current.value).toBe(99);
});
