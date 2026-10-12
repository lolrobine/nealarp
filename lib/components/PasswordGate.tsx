"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { forgetUnlock, isUnlocked, rememberUnlock, verifyPassword } from "@/lib/auth/sitePassword";

type Status = "checking" | "locked" | "unlocked";

/**
 * Hides the whole site behind a password screen until the visitor unlocks it.
 *
 * Mounted once in app/layout.tsx so every route (and the 404 page) is covered.
 * Because "checking" is also the server-rendered state, the protected pages are
 * never painted before the password has been accepted.
 */
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

function UnlockScreen({ checking, onUnlocked }: { checking: boolean; onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [capsLock, setCapsLock] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  useEffect(() => {
    if (!checking) {
      // Small delay to ensure animation finished and input is in DOM
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [checking]);

  // Cooldown timer with dynamic error update
  useEffect(() => {
    if (cooldown <= 0) {
      if (error && error.includes("Try again in")) {
        // Keep generic message when cooldown ends, don't auto-clear
      }
      return;
    }
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown, error]);

  // Update error message dynamically during cooldown
  useEffect(() => {
    if (cooldown > 0 && attempts >= 3) {
      setError(`Wrong password. Try again in ${cooldown}s. (${attempts} failed)`);
    }
  }, [cooldown, attempts]);

  const trimmedPassword = password.trim();
  const isInputDisabled = checking || submitting || cooldown > 0;
  const isButtonDisabled = checking || submitting || cooldown > 0 || trimmedPassword.length === 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isButtonDisabled) return;

    setSubmitting(true);
    setError(null);

    try {
      if (await verifyPassword(password)) {
        setSuccess(true);
        // Small success animation delay
        await new Promise((r) => setTimeout(r, 400));
        await rememberUnlock();
        onUnlocked();
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setSubmitting(false);
    setPassword("");

    if (newAttempts >= 3) {
      const delay = Math.min(30, Math.pow(2, newAttempts - 3)); // 1,2,4,8,16,30
      setCooldown(delay);
      setError(`Wrong password. Try again in ${delay}s. (${newAttempts} failed)`);
    } else {
      setError("That password is not right. Please try again.");
    }
    shake.start({ x: [0, -10, 10, -7, 7, 0], transition: { duration: 0.4 } });
    // Refocus after shake
    setTimeout(() => inputRef.current?.focus(), 400);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // CapsLock detection
    if (e.getModifierState && e.getModifierState("CapsLock")) {
      setCapsLock(true);
    } else {
      setCapsLock(false);
    }
    if (e.key === "Escape") {
      setPassword("");
      setError(null);
    }
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState("CapsLock"));
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-[var(--background)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[100%] w-[150%] -translate-x-1/2 rounded-full bg-gradient-to-b from-[var(--primary)]/10 via-[var(--primary)]/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
      </div>

      <div className="relative flex min-h-full flex-1 items-center justify-center px-4 py-10">
        <motion.div
          animate={shake}
          className="w-full max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Logo / Branding */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-bold">neal.fun</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">v2</span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl backdrop-blur-sm"
            noValidate
          >
            <div className="flex justify-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                  success
                    ? "bg-emerald-500 text-white"
                    : error
                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                      : "bg-[var(--secondary)] text-[var(--foreground)]"
                }`}
              >
                {checking ? (
                  <Spinner />
                ) : success ? (
                  <CheckIcon className="h-7 w-7" />
                ) : error ? (
                  <span className="text-xl">⚠️</span>
                ) : (
                  <LockIcon className="h-6 w-6" />
                )}
              </div>
            </div>

            <h1 className="mt-5 text-center text-xl font-bold tracking-tight">
              {success ? "Unlocked!" : "This site is password protected"}
            </h1>
            <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
              {success ? "Welcome in — loading experiences…" : "Enter the password to continue."}
            </p>

            {/* Attempt dots */}
            {attempts > 0 && !success && (
              <div className="mt-4 flex justify-center gap-1.5">
                {Array.from({ length: Math.min(attempts, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-red-400"
                    style={{ opacity: 1 - i * 0.15 }}
                  />
                ))}
                {attempts > 5 && (
                  <span className="ml-1 text-[10px] text-red-400">+{attempts - 5}</span>
                )}
              </div>
            )}

            <div className="mt-6">
              <label htmlFor="site-password" className="sr-only">
                Site password
              </label>
              <div className="relative">
                <input
                  id="site-password"
                  ref={inputRef}
                  type={revealed ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error && !event.target.value.includes("Try again")) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  placeholder="Password"
                  autoComplete="current-password"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={isInputDisabled}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={
                    error ? "site-password-error" : capsLock ? "caps-lock-warning" : undefined
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-12 text-base outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setRevealed((value) => !value)}
                  aria-label={revealed ? "Hide password" : "Show password"}
                  aria-pressed={revealed}
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  {revealed ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* CapsLock warning */}
              {capsLock && !isInputDisabled && (
                <p
                  id="caps-lock-warning"
                  className="mt-2 flex items-center gap-1 text-xs text-amber-500"
                >
                  <span>⚠️</span> Caps Lock is on
                </p>
              )}

              {/* Cooldown progress */}
              {cooldown > 0 && (
                <div className="mt-3">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                    <motion.div
                      className="h-full bg-amber-500"
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
                  id="site-password-error"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 border border-red-500/20"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isButtonDisabled}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              {cooldown > 0 ? (
                <>
                  <span>⏳</span> Wait {cooldown}s...
                </>
              ) : submitting || success ? (
                <>
                  <Spinner className="h-4 w-4 text-current" />
                  {success ? "Unlocked" : "Checking…"}
                </>
              ) : (
                "Unlock"
              )}
            </button>

            <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
              You only need to enter it once per browser.{" "}
              <span className="hidden sm:inline">Press Esc to clear.</span>
            </p>
          </form>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Default password is{" "}
              <code className="rounded bg-[var(--secondary)] px-1 py-0.5">nealarp</code> • Change
              via{" "}
              <code className="rounded bg-[var(--secondary)] px-1 py-0.5">
                NEXT_PUBLIC_SITE_PASSWORD
              </code>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center text-[10px] text-[var(--muted-foreground)]">
        Protected by client-side gate • Not real auth for static export
      </div>
    </motion.div>
  );
}

/**
 * Small floating button that forgets the unlock for this browser so the lock
 * screen can be shown again.
 */
function LockButton({ onLock }: { onLock: () => void }) {
  return (
    <button
      type="button"
      onClick={onLock}
      title="Lock this site"
      aria-label="Lock this site"
      className="fixed bottom-4 left-4 z-[90] flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-lg opacity-60 transition-all hover:text-[var(--foreground)] hover:opacity-100 hover:scale-105 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <LockIcon className="h-4 w-4" />
    </button>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-6 w-6 animate-spin text-[var(--muted-foreground)]"}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
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
      aria-hidden="true"
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
      aria-hidden="true"
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
      aria-hidden="true"
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
      aria-hidden="true"
    >
      <path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.9 4" />
      <path d="M6.6 6.6A17.6 17.6 0 0 0 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
