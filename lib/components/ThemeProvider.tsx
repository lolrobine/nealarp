"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
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
      // Optional call and optional listeners, matching usePlayback: without
      // matchMedia this effect used to throw and unmount the whole tree.
      const media = window.matchMedia?.("(prefers-color-scheme: dark)");
      const handleChange = () => {
        apply(getSystemTheme());
      };
      media?.addEventListener("change", handleChange);
      return () => media?.removeEventListener("change", handleChange);
    }
  }, [theme]);

  /*
   * framer-motion does not consult prefers-reduced-motion on its own: its
   * default is reducedMotion "never", and the global CSS rule in globals.css
   * cannot reach it either, because that rule only shortens CSS animations
   * and transitions while framer drives transforms from JavaScript. Fourteen
   * files across the catalogue animate this way, so without this one line
   * none of them honoured the setting. "user" keeps opacity and colour fades
   * and drops the transform and layout movement, which is the part that
   * makes people ill.
   */
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
