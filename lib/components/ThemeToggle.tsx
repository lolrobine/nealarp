"use client";

import { useThemeStore } from "@/lib/store/theme";
import { useResolvedTheme } from "@/lib/hooks/useResolvedTheme";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const setTheme = useThemeStore((s) => s.setTheme);
  const resolved = useResolvedTheme();

  const toggleTheme = () => {
    setTheme(resolved === "dark" ? "light" : "dark");
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center hover:bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
      aria-pressed={resolved === "dark"}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: resolved === "dark" ? 0 : 180,
        }}
        transition={{ duration: 0.3 }}
      >
        {resolved === "dark" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--foreground)]"
            aria-hidden="true"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--foreground)]"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
}
