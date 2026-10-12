"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { forgetUnlock, isUnlocked, rememberUnlock, verifyPassword } from "@/lib/auth/sitePassword";
import { useThemeStore, resolveTheme } from "@/lib/store/theme";

type Status = "checking" | "locked" | "unlocked";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise((r) => setTimeout(r, 300));
    Promise.all([isUnlocked(), minDelay]).then(([unlocked]) => {
      if (!cancelled) setStatus(unlocked ? "unlocked" : "locked");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnlocked = useCallback(() => setStatus("unlocked"), []);
  const handleLock = useCallback(() => {
    forgetUnlock();
    setStatus("locked");
  }, []);

  if (status === "checking") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)]" />
      </div>
    );
  }

  if (status === "locked") {
    return <UnlockScreen onUnlocked={handleUnlocked} />;
  }

  return (
    <>
      {children}
      <button
        type="button"
        onClick={handleLock}
        className="fixed bottom-4 left-4 z-[90] rounded-full border bg-[var(--card)] px-3 py-1.5 text-xs opacity-60 hover:opacity-100"
        aria-label="Lock site"
      >
        Lock
      </button>
    </>
  );
}

function UnlockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [resolved, setResolved] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setResolved(resolveTheme(theme));
    if (theme === "system" && typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setResolved(media.matches ? "dark" : "light");
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const trimmed = password.trim();
  const isButtonDisabled = submitting || cooldown > 0 || trimmed.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isButtonDisabled) return;
    setSubmitting(true);
    setError(null);
    try {
      if (await verifyPassword(password)) {
        await rememberUnlock();
        onUnlocked();
        return;
      }
    } catch {
      setError("Something went wrong.");
      setSubmitting(false);
      return;
    }
    setAttempts((a) => a + 1);
    setSubmitting(false);
    setPassword("");
    if (attempts + 1 >= 3) {
      const delay = Math.min(30, Math.pow(2, attempts + 1 - 3));
      setCooldown(delay);
      setError(`Wrong password. Wait ${delay}s`);
    } else {
      setError("Wrong password.");
    }
    shake.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.35 } });
  }

  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--background)]">
      {/* One dark mode button */}
      <div className="flex h-14 items-center justify-end px-4">
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-[var(--card)] hover:bg-[var(--secondary)]"
          aria-label="Toggle dark mode"
        >
          <span className="text-base">{mounted ? (resolved === "dark" ? "☀️" : "🌙") : "🌙"}</span>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-14">
        <motion.div animate={shake} className="w-full max-w-[360px]">
          <div className="rounded-2xl border bg-[var(--card)] p-7 shadow-sm">
            <h1 className="text-center text-xl font-bold">Enter password</h1>
            <p className="mt-1 text-center text-sm text-[var(--muted-foreground)]">
              This site is protected
            </p>

            <form onSubmit={handleSubmit} className="mt-6" noValidate>
              <label htmlFor="site-password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="site-password"
                  ref={inputRef}
                  type={revealed ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Password"
                  autoComplete="current-password"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={submitting || cooldown > 0}
                  className="w-full rounded-xl border bg-[var(--background)] px-4 py-3 pr-12 text-[15px] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  aria-label={revealed ? "Hide" : "Show"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {revealed ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-500">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isButtonDisabled}
                className="mt-5 w-full rounded-xl bg-[var(--primary)] py-3 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {cooldown > 0 ? `Wait ${cooldown}s` : submitting ? "Checking…" : "Unlock"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.9 4" />
      <path d="M6.6 6.6A17.6 17.6 0 0 0 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
