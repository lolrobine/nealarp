"use client";
import { useState, useSyncExternalStore } from "react";
const changed = "nealarp-progress";
function subscribe(listener: () => void) {
  window.addEventListener(changed, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(changed, listener);
    window.removeEventListener("storage", listener);
  };
}
/** Version the key and validate every value read from storage. Server snapshot stays deterministic. */
export function useStoredValue<T>(
  key: string,
  initial: T,
  validate: (value: unknown) => value is T
) {
  const [fallback, setFallback] = useState(initial);
  const [unavailable, setUnavailable] = useState(false);
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null
  );
  let value = fallback;
  if (raw !== null && !unavailable) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (validate(parsed)) value = parsed;
    } catch {
      /* invalid or old data is ignored */
    }
  }
  function save(next: T) {
    setFallback(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event(changed));
    } catch {
      setUnavailable(true);
    }
  }
  function clear() {
    setFallback(initial);
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(new Event(changed));
    } catch {
      setUnavailable(true);
    }
  }
  return { value, save, clear, unavailable };
}

/** Namespaced progress store; useStoredValue also supports existing legacy storage keys. */
export function useSavedProgress<T>(
  id: string,
  initial: T,
  validate: (value: unknown) => value is T
) {
  return useStoredValue(`nealarp:progress:v1:${id}`, initial, validate);
}
