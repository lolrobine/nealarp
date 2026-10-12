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
 *
 * The password itself lives in lib/auth/sitePassword.ts.
 */
export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");

  // localStorage only exists in the browser, so the unlock state is resolved
  // after mount — "checking" is shared by the server render and the first paint.
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
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  useEffect(() => {
    if (!checking) inputRef.current?.focus();
  }, [checking]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking || submitting || cooldown > 0 || !password.trim()) return;

    setSubmitting(true);
    setError(null);

    if (await verifyPassword(password)) {
      await rememberUnlock();
      onUnlocked(); // unmounts this screen and reveals the site
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setSubmitting(false);
    setPassword("");
    // Exponential backoff after 3 fails
    if (newAttempts >= 3) {
      const delay = Math.min(30, Math.pow(2, newAttempts - 3)); // 1,2,4,8,16,30
      setCooldown(delay);
      setError(`Wrong password. Try again in ${delay}s. (${newAttempts} failed attempts)`);
    } else {
      setError("That password is not right. Please try again.");
    }
    shake.start({ x: [0, -10, 10, -7, 7, 0], transition: { duration: 0.4 } });
    inputRef.current?.focus();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[var(--background)]"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <motion.div animate={shake} className="w-full max-w-sm">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl"
          >
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--foreground)]">
                {checking ? <Spinner /> : <LockIcon className="h-6 w-6" />}
              </div>
            </div>

            <h1 className="mt-5 text-center text-xl font-bold">This site is password protected</h1>
            <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
              Enter the password to continue to the experiences.
            </p>

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
                    if (error) setError(null);
                  }}
                  placeholder="Password"
                  autoComplete="current-password"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={checking}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "site-password-error" : undefined}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-12 text-base outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setRevealed((value) => !value)}
                  aria-label={revealed ? "Hide password" : "Show password"}
                  aria-pressed={revealed}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  {revealed ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <p
                id="site-password-error"
                role="alert"
                className="mt-3 text-sm text-[var(--destructive)]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={checking || submitting || cooldown > 0 || password.length === 0}
              className="mt-5 w-full rounded-lg bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0 ? `Wait ${cooldown}s...` : submitting ? "Checking…" : "Unlock"}
            </button>

            <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
              You only need to enter it once per browser.
            </p>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Small floating button that forgets the unlock for this browser so the lock
 * screen can be shown again. Convenience only — delete it if you don't want it.
 */
function LockButton({ onLock }: { onLock: () => void }) {
  return (
    <button
      type="button"
      onClick={onLock}
      title="Lock this site"
      aria-label="Lock this site"
      className="fixed bottom-4 left-4 z-[90] flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] opacity-40 transition-opacity hover:text-[var(--foreground)] hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <LockIcon className="h-4 w-4" />
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-6 w-6 animate-spin text-[var(--muted-foreground)]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
