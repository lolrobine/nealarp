"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { forgetUnlock, isUnlocked, rememberUnlock, verifyPassword } from "@/lib/auth/sitePassword";
import { Confetti } from "./Confetti";
import { ThemeToggle } from "./ThemeToggle";

type Status = "checking" | "locked" | "unlocked";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    isUnlocked().then((unlocked) => {
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
      <AnimatePresence initial={false} mode="wait">
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

const funMessages = [
  "Psst... the magic word is hidden in plain sight ✨",
  "Hint: it's the name of this project 😉",
  "Think short, think fun, think neal...",
  "You got this! One more try? 💪",
  "The password is literally the site name 🤫",
];

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
  const [konamiProgress, setKonamiProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  const funMessage = funMessages[Math.min(attempts, funMessages.length - 1)];

  useEffect(() => {
    if (!checking) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [checking]);

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

  // Konami easter egg: ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a
  useEffect(() => {
    const konami = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    const handler = (e: KeyboardEvent) => {
      if (e.key === konami[konamiProgress]) {
        const next = konamiProgress + 1;
        if (next === konami.length) {
          setPassword("nealarp");
          setShowHint(true);
          setKonamiProgress(0);
        } else {
          setKonamiProgress(next);
        }
      } else {
        setKonamiProgress(0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [konamiProgress]);

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
        await new Promise((r) => setTimeout(r, 600));
        await rememberUnlock();
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

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[var(--background)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      <Confetti active={success} />

      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient mesh */}
        <motion.div
          className="absolute -top-1/2 left-1/2 h-[120%] w-[180%] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-500/15 via-cyan-500/10 to-transparent blur-3xl"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 3, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/2 left-1/4 h-[80%] w-[100%] rounded-full bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Floating orbs */}
        <motion.div
          className="absolute left-[15%] top-[20%] h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-cyan-400/20 blur-2xl"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[20%] top-[60%] h-40 w-40 rounded-full bg-gradient-to-br from-emerald-400/15 to-sky-400/15 blur-2xl"
          animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute left-[50%] top-[10%] h-24 w-24 rounded-full bg-gradient-to-br from-amber-400/10 to-orange-400/10 blur-xl"
          animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
      </div>

      {/* Top bar */}
      <div className="relative flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)] shadow-sm">
            <span className="text-sm font-bold">n</span>
          </div>
          <span className="font-bold tracking-tight">neal.fun</span>
          <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
            v2
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/lolrobine/nealarp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            aria-label="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Main */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-6">
        <motion.div
          animate={shake}
          className="w-full max-w-[380px]"
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]/80 p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8"
            noValidate
          >
            {/* Card shine */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent dark:from-white/[0.04]" />

            <div className="relative">
              {/* Icon */}
              <div className="flex justify-center">
                <motion.div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-colors ${
                    success
                      ? "bg-emerald-500 text-white shadow-emerald-500/25"
                      : error
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-violet-500/20"
                  }`}
                  animate={success ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 0.6 }}
                >
                  {checking ? (
                    <Spinner />
                  ) : success ? (
                    <CheckIcon className="h-8 w-8" />
                  ) : error ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-2xl"
                      aria-hidden
                    >
                      {attempts >= 3 ? "😵" : "🔒"}
                    </motion.span>
                  ) : (
                    <LockIcon className="h-7 w-7" />
                  )}
                </motion.div>
              </div>

              <h1 className="mt-5 text-center text-[22px] font-bold tracking-tight">
                {success ? "Unlocked! 🎉" : checking ? "Checking..." : "Protected Site"}
              </h1>
              <p className="mt-1.5 text-center text-sm leading-5 text-[var(--muted-foreground)]">
                {success
                  ? "Welcome back — opening the fun…"
                  : checking
                    ? "Verifying your browser…"
                    : "Enter the password to explore 8 interactive experiences."}
              </p>

              {/* Attempt indicator */}
              <AnimatePresence>
                {attempts > 0 && !success && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 flex items-center justify-center gap-2"
                  >
                    <div className="flex gap-1.5">
                      {Array.from({ length: Math.min(attempts, 5) }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="h-2 w-2 rounded-full bg-red-400"
                          style={{ opacity: 1 - i * 0.15 }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {attempts} failed • {funMessage}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="mt-6">
                <label htmlFor="site-password" className="sr-only">
                  Site password
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                    <span className="text-sm">🔑</span>
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
                    aria-describedby={
                      error ? "site-password-error" : capsLock ? "caps-lock-warning" : undefined
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-3.5 pl-10 pr-[88px] text-[15px] font-medium outline-none transition-all placeholder:text-[var(--muted-foreground)]/60 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 group-hover:border-[var(--border)]/80"
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
                        aria-label="Clear password"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRevealed((v) => !v)}
                      aria-label={revealed ? "Hide password" : "Show password"}
                      aria-pressed={revealed}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                    >
                      {revealed ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {capsLock && !isDisabled && (
                    <motion.p
                      id="caps-lock-warning"
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                    >
                      <span>⚠️</span> Caps Lock is on
                    </motion.p>
                  )}
                </AnimatePresence>

                {cooldown > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] mb-1">
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
                  <motion.div
                    id="site-password-error"
                    role="alert"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    className="mt-4 flex gap-2.5 rounded-xl bg-red-500/10 px-3.5 py-3 text-[13px] leading-5 text-red-600 dark:text-red-400 border border-red-500/20"
                  >
                    <span className="mt-0.5 shrink-0">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hint */}
              <AnimatePresence>
                {showHint && !success && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-3"
                  >
                    <div className="flex gap-2.5">
                      <span className="text-sm">💡</span>
                      <div className="text-[13px] leading-5">
                        <p className="font-semibold text-amber-700 dark:text-amber-300">
                          Need a hint?
                        </p>
                        <p className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">
                          It&apos;s{" "}
                          <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-amber-800 dark:text-amber-200">
                            nealarp
                          </code>{" "}
                          — the project name. Or try the Konami code ↑↑↓↓←→←→BA
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPassword("nealarp");
                            setError(null);
                            inputRef.current?.focus();
                          }}
                          className="mt-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
                        >
                          Fill password
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={isButtonDisabled}
                whileTap={{ scale: isButtonDisabled ? 1 : 0.98 }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.5)] transition-all hover:shadow-[0_12px_24px_-10px_rgba(124,58,237,0.6)] hover:from-violet-600 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30"
              >
                {cooldown > 0 ? (
                  <>
                    <span>⏳</span> Wait {cooldown}s
                  </>
                ) : submitting || success ? (
                  <>
                    <Spinner className="h-4 w-4 text-white" />
                    {success ? "Unlocked — entering..." : "Checking…"}
                  </>
                ) : (
                  <>
                    Unlock <span aria-hidden>→</span>
                  </>
                )}
              </motion.button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[10px]">
                    ↵
                  </kbd>{" "}
                  to unlock
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[10px]">
                    Esc
                  </kbd>{" "}
                  to clear
                </span>
                <span>•</span>
                <span>Once per browser</span>
              </div>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-[var(--muted-foreground)]">
            <span className="h-px w-8 bg-[var(--border)]" />
            <span>8 experiences • Built with Next.js 15 • PWA ready</span>
            <span className="h-px w-8 bg-[var(--border)]" />
          </div>
        </motion.div>
      </div>

      <div className="relative pb-5 text-center">
        <p className="text-[10px] leading-4 text-[var(--muted-foreground)]/70">
          Client-side gate for static export • Not real authentication •{" "}
          <a
            href="https://github.com/lolrobine/nealarp"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-[var(--foreground)]"
          >
            Open source
          </a>
          {konamiProgress > 0 && (
            <span className="ml-2 font-mono text-violet-500">Konami {konamiProgress}/10</span>
          )}
        </p>
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
    <div className="fixed bottom-4 left-4 z-[90] flex items-center gap-2">
      <button
        type="button"
        onClick={() => (confirm ? onLock() : setConfirm(true))}
        title={confirm ? "Click again to lock" : "Lock this site"}
        aria-label={confirm ? "Confirm lock" : "Lock this site"}
        className={`flex h-9 items-center justify-center gap-1.5 rounded-full border bg-[var(--card)] px-3 text-xs font-medium shadow-lg transition-all hover:scale-105 ${
          confirm
            ? "border-red-500/50 bg-red-500 text-white"
            : "border-[var(--border)] text-[var(--muted-foreground)] opacity-70 hover:opacity-100 hover:text-[var(--foreground)]"
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
      xmlns="http://www.w3.org/2000/svg"
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
      xmlns="http://www.w3.org/2000/svg"
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
      xmlns="http://www.w3.org/2000/svg"
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
      xmlns="http://www.w3.org/2000/svg"
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
