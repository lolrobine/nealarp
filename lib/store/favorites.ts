"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},
      toggleFavorite: (id: string) => {
        const fav = { ...get().favorites };
        if (fav[id]) delete fav[id];
        else fav[id] = true;
        set({ favorites: fav });
      },
      isFavorite: (id: string) => !!get().favorites[id],
      clear: () => set({ favorites: {} }),
    }),
    { name: "favorites-storage" }
  )
);
