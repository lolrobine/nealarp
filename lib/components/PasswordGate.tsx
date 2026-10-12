"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { forgetUnlock, isUnlocked, rememberUnlock, verifyPassword } from "@/lib/auth/sitePassword";
import { Confetti } from "./Confetti";
import { useThemeStore, resolveTheme } from "@/lib/store/theme";

type Status = "checking" | "locked" | "unlocked";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    // Minimum checking time to prevent flash/disappear perception
    const minDelay = new Promise((r) => setTimeout(r, 400));
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

  return (
    <>
      <AnimatePresence initial={false}>
        {status !== "unlocked" && (
          <UnlockScreen
            key="site-lock"
            checking={status === "checking"}
            onUnlocked={handleUnlocked}
          />
        )}
      </AnimatePresence>
      {status === "unlocked" && (
        <>
          {children}
          <LockButton onLock={handleLock} />
        </>
      )}
    </>
  );
}

function UnlockScreen({ checking, onUnlocked }: { checking: boolean; onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [capsLock, setCapsLock] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  // Single dark mode button — respects browser settings via system theme
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [resolved, setResolved] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setResolved(resolveTheme(theme));
    update();
    if (theme === "system" && typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setResolved(media.matches ? "dark" : "light");
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme]);

  useEffect(() => {
    if (!checking && mounted) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [checking, mounted]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (cooldown > 0 && attempts >= 3) {
      setError(`Wrong password. Try again in ${cooldown}s • ${attempts} failed`);
    }
  }, [cooldown, attempts]);

  const trimmed = password.trim();
  const isDisabled = checking || submitting || cooldown > 0;
  const isButtonDisabled = checking || submitting || cooldown > 0 || trimmed.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isButtonDisabled) return;
    setSubmitting(true);
    setError(null);
    try {
      if (await verifyPassword(password)) {
        setSuccess(true);
        await rememberUnlock();
        await new Promise((r) => setTimeout(r, 100));
        onUnlocked();
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setSubmitting(false);
    setPassword("");
    if (nextAttempts >= 3) {
      const delay = Math.min(30, Math.pow(2, nextAttempts - 3));
      setCooldown(delay);
      setError(`Wrong password. Try again in ${delay}s • ${nextAttempts} failed`);
      if (nextAttempts >= 4) setShowHint(true);
    } else {
      setError("That password is not right. Try again.");
    }
    shake.start({ x: [0, -12, 12, -8, 8, 0], transition: { duration: 0.45, ease: "easeOut" } });
    setTimeout(() => inputRef.current?.focus(), 450);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.getModifierState?.("CapsLock")) setCapsLock(true);
    else setCapsLock(false);
    if (e.key === "Escape") {
      setPassword("");
      setError(null);
      setCapsLock(false);
    }
  }
  function onKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.getModifierState) setCapsLock(e.getModifierState("CapsLock"));
  }

  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");

  // Prevent flash/disappear: keep screen mounted during checking, show explicit loading
  if (checking) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--background)]">
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
              <Spinner className="h-7 w-7 text-white" />
            </div>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[var(--background)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <div className="pointer-events-none fixed inset-0 z-[110]">
        <Confetti active={success} />
      </div>

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 left-1/2 h-[120%] w-[180%] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-500/15 via-cyan-500/10 to-transparent blur-3xl dark:from-violet-500/10 dark:via-cyan-500/5"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
      </div>

      {/* Single dark mode button — top right, respects browser */}
      <div className="relative flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg">
            <span className="text-[15px] font-bold">N</span>
          </div>
          <span className="font-bold tracking-tight">Nealarp</span>
        </div>
        {/* ONE dark mode button */}
        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-sm transition-colors hover:bg-[var(--secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
          aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
          title={`${resolved === "dark" ? "Light" : "Dark"} mode (browser: ${theme})`}
        >
          <span className="text-lg">{mounted ? (resolved === "dark" ? "☀️" : "🌙") : "🌙"}</span>
        </motion.button>
      </div>

      {/* Main card */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-6">
        <motion.div
          className="w-full max-w-[380px]"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div animate={shake}>
            <form
              onSubmit={handleSubmit}
              className="relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]/80 p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8"
              noValidate
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent dark:from-white/[0.04]" />
              <div className="relative">
                <div className="flex justify-center">
                  <motion.div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${
                      success
                        ? "bg-emerald-500 text-white"
                        : error
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-gradient-to-br from-violet-500 to-cyan-500 text-white"
                    }`}
                    animate={success ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {success ? (
                      <CheckIcon className="h-8 w-8" />
                    ) : error ? (
                      <span className="text-2xl">🔒</span>
                    ) : (
                      <LockIcon className="h-7 w-7" />
                    )}
                  </motion.div>
                </div>

                <h1 className="mt-5 text-center text-[22px] font-bold tracking-tight">
                  {success ? "Unlocked! 🎉" : "Protected Site"}
                </h1>
                <p className="mt-1.5 text-center text-sm text-[var(--muted-foreground)]">
                  {success ? "Opening the fun…" : "Enter the password to continue."}
                </p>

                {attempts > 0 && !success && (
                  <div className="mt-4 flex justify-center gap-1.5">
                    {Array.from({ length: Math.min(attempts, 5) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-red-400"
                        style={{ opacity: 1 - i * 0.15 }}
                      />
                    ))}
                    <span className="ml-1 text-[11px] text-[var(--muted-foreground)]">
                      {attempts} failed
                    </span>
                  </div>
                )}

                <div className="mt-6">
                  <label htmlFor="site-password" className="sr-only">
                    Site password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                      🔑
                    </div>
                    <input
                      id="site-password"
                      ref={inputRef}
                      type={revealed ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error && !e.target.value.includes("Try again")) setError(null);
                      }}
                      onKeyDown={onKeyDown}
                      onKeyUp={onKeyUp}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      disabled={isDisabled}
                      aria-invalid={!!error}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-3.5 pl-10 pr-[88px] text-[15px] font-medium outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60"
                    />
                    <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                      {password.length > 0 && !isDisabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setPassword("");
                            setError(null);
                            inputRef.current?.focus();
                          }}
                          aria-label="Clear"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRevealed((v) => !v)}
                        aria-label={revealed ? "Hide" : "Show"}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {revealed ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {capsLock && !isDisabled && (
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      ⚠️ Caps Lock is on
                    </p>
                  )}

                  {cooldown > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-[var(--muted-foreground)]">
                        <span>Cooldown</span>
                        <span className="font-mono">{cooldown}s</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: cooldown, ease: "linear" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.p
                      role="alert"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-[13px] text-red-600 dark:text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {showHint && !success && (
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-3 text-[13px] text-amber-700 dark:text-amber-300">
                    💡 Think about the project name… it&apos;s short and fun.
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={isButtonDisabled}
                  whileTap={{ scale: isButtonDisabled ? 1 : 0.98 }}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.5)] disabled:opacity-50"
                >
                  {cooldown > 0 ? (
                    <>⏳ Wait {cooldown}s</>
                  ) : submitting || success ? (
                    <>
                      <Spinner className="h-4 w-4 text-white" />
                      {success ? "Unlocked" : "Checking…"}
                    </>
                  ) : (
                    <>Unlock →</>
                  )}
                </motion.button>

                <p className="mt-3 text-center text-[11px] text-[var(--muted-foreground)]">
                  Press Enter to unlock • Esc to clear • Once per browser
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>

      <div className="pb-5 text-center text-[10px] text-[var(--muted-foreground)]/70">
        Client-side gate • Respects browser light/dark •{" "}
        <a
          href="https://github.com/lolrobine/nealarp"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted"
        >
          Open source
        </a>
      </div>
    </motion.div>
  );
}

function LockButton({ onLock }: { onLock: () => void }) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [confirm]);
  return (
    <div className="fixed bottom-4 left-4 z-[90]">
      <button
        type="button"
        onClick={() => (confirm ? onLock() : setConfirm(true))}
        className={`flex h-9 items-center gap-1.5 rounded-full border bg-[var(--card)] px-3 text-xs shadow-lg ${
          confirm
            ? "border-red-500/50 bg-red-500 text-white"
            : "border-[var(--border)] opacity-70 hover:opacity-100"
        }`}
      >
        <LockIcon className="h-4 w-4" />
        {confirm ? "Confirm lock?" : "Lock"}
      </button>
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-6 w-6 animate-spin"}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12l5 5l10 -10" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
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
      strokeLinecap="round"
      strokeLinejoin="round"
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
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.9 4" />
      <path d="M6.6 6.6A17.6 17.6 0 0 0 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
