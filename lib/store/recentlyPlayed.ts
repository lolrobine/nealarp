"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentlyPlayedState {
  played: Record<string, number>; // id -> timestamp
  markPlayed: (id: string) => void;
  clear: () => void;
}

export const useRecentlyPlayedStore = create<RecentlyPlayedState>()(
  persist(
    (set, get) => ({
      played: {},
      markPlayed: (id: string) => {
        const played = { ...get().played, [id]: Date.now() };
        // Keep only last 20
        const entries = Object.entries(played).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
        const trimmed: Record<string, number> = {};
        for (let i = 0; i < Math.min(entries.length, 20); i++) {
          const entry = entries[i]!;
          trimmed[entry[0]] = entry[1]!;
        }
        set({ played: trimmed });
      },
      clear: () => set({ played: {} }),
    }),
    {
      name: "recently-played-storage",
    }
  )
);
