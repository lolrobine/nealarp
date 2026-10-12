import { describe, it, expect, beforeEach } from "vitest";
import { useFavoritesStore } from "./favorites";

describe("favorites store", () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: {} });
  });

  it("toggles favorite", () => {
    const { toggleFavorite } = useFavoritesStore.getState();
    toggleFavorite("spend-money");
    expect(useFavoritesStore.getState().favorites["spend-money"]).toBe(true);
    toggleFavorite("spend-money");
    expect(useFavoritesStore.getState().favorites["spend-money"]).toBeUndefined();
  });

  it("isFavorite", () => {
    useFavoritesStore.setState({ favorites: { "deep-sea": true } });
    expect(useFavoritesStore.getState().isFavorite("deep-sea")).toBe(true);
    expect(useFavoritesStore.getState().isFavorite("unknown")).toBe(false);
  });
});
