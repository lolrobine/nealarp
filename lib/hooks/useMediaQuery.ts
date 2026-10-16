"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverDefault = false): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    },
    [query]
  );
  const getSnapshot = useCallback(
    () =>
      typeof window.matchMedia === "function" ? window.matchMedia(query).matches : serverDefault,
    [query, serverDefault]
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => serverDefault);
}
