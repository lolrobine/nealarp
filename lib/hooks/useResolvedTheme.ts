"use client";
import { useThemeStore } from "@/lib/store/theme";
import { useMediaQuery } from "./useMediaQuery";

export function useResolvedTheme(): "light" | "dark" {
  const theme = useThemeStore((s) => s.theme);
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)", true);
  return theme === "system" ? (systemDark ? "dark" : "light") : theme;
}
