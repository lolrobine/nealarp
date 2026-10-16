"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
/** Stable server/first hydration snapshot for browser-only presentation. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
