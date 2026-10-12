"use client";

import { useEffect } from "react";
import { useThemeStore, resolveTheme, getSystemTheme } from "@/lib/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  // Apply theme class to document
  useEffect(() => {
    const apply = (t: "light" | "dark") => {
      if (t === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    apply(resolveTheme(theme));

    // Listen for system changes when in system mode
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        apply(getSystemTheme());
      };
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return <>{children}</>;
}
