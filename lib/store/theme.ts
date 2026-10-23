import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme: Theme) => set({ theme }),
    }),
    {
      name: "theme-storage",
      // Only persist the preference, not derived state
      partialize: (state) => ({ theme: state.theme }) as { theme: Theme },
    }
  )
);

// Helper to resolve system preference (client only)
export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  // Guarded the same way useMediaQuery and usePlayback guard it. A window
  // without matchMedia is rare in a browser and routine in a test runner,
  // and an unguarded call here throws during ThemeProvider's first effect,
  // which takes the whole tree down with it.
  if (typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}
