"use client";

import { useSyncExternalStore, useState } from "react";

const eventName = "nealarp-personal-best";
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(eventName, listener);
  };
}

export function usePersonalBest(id: string) {
  const key = `nealarp:best:v1:${id}`;
  const [unavailable, setUnavailable] = useState(false);
  const best = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        const value = Number(raw);
        return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
      } catch {
        return null;
      }
    },
    () => null
  );
  function save(score: number) {
    if (!Number.isFinite(score) || score < 0 || score > 100) return;
    try {
      const raw = localStorage.getItem(key);
      const previous = raw === null ? null : Number(raw);
      if (
        previous === null ||
        !Number.isFinite(previous) ||
        previous < 0 ||
        previous > 100 ||
        score > previous
      ) {
        localStorage.setItem(key, String(score));
      }
      window.dispatchEvent(new Event(eventName));
    } catch {
      setUnavailable(true);
    }
  }
  function clear() {
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(new Event(eventName));
    } catch {
      setUnavailable(true);
    }
  }
  return { id, best, save, clear, unavailable };
}
