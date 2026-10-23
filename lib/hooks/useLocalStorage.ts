"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Settings that survive a reload.
 *
 * The optional guard is the important parameter. Storage is shared with
 * every other version of this site a browser has ever loaded, and a value
 * read back is only a promise about its type, never proof: JSON.parse
 * returns unknown and casting it to T just hides that. useStoredValue in
 * useSavedProgress has always required a guard for exactly this reason;
 * this hook did not, so Pocket Sand took its brush material straight from
 * storage and stamped the number into the sand grid, where anything
 * outside 0 to 4 is a cell the simulation never moves and the goal can
 * never count.
 *
 * Without a guard the old behaviour is kept, so existing callers are free
 * to stay as they are, but every caller in this project passes one. Define
 * the guard at module scope: an inline arrow is a new function on every
 * render, which would resubscribe the storage listener each time.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validate?: (value: unknown) => value is T
) {
  const read = useCallback(
    (raw: string | null): T => {
      if (raw === null || raw === "") return initialValue;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (validate && !validate(parsed)) return initialValue;
        return parsed as T;
      } catch {
        return initialValue;
      }
    },
    [initialValue, validate]
  );

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      return read(window.localStorage.getItem(key));
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`useLocalStorage set error for key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Sync across tabs. A cleared key arrives as null and resets to the
  // default rather than being ignored, and the guard applies here too:
  // another tab is no more trustworthy than the stored string was.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setStoredValue(read(event.newValue));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, read]);

  return [storedValue, setValue] as const;
}
