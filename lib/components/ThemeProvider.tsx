"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme on mount
    const stored = localStorage.getItem("theme-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state?.theme) {
          setTheme(parsed.state.theme);
          return;
        }
      } catch {
        // ignore
      }
    }
    // Default to system preference
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(systemDark ? "dark" : "light");

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        setTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
