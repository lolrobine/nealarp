"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { rules } from "./rules";
import { Confetti } from "@/lib/components/Confetti";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export default function PasswordGamePage() {
  const [password, setPassword] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("password-game-pw") || "";
    } catch {
      return "";
    }
  });
  const [unlockedRules, setUnlockedRules] = useState(1);
  const [copied, setCopied] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const shakeControls = useAnimationControls();
  const prevFailedRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  // Persist password
  useEffect(() => {
    try {
      localStorage.setItem("password-game-pw", password);
    } catch {}
  }, [password]);

  // Evaluate all rules
  const ruleResults = useMemo(() => {
    return rules.map((rule) => ({
      ...rule,
      passed: rule.validate(password),
    }));
  }, [password]);

  // Unlock new rules as previous ones are satisfied + shake on new failure
  useEffect(() => {
    for (let i = 0; i < unlockedRules && i < rules.length; i++) {
      const res = ruleResults[i];
      if (!res || !res.passed) {
        if (
          prevFailedRef.current !== i &&
          prevFailedRef.current !== null &&
          !prefersReducedMotion
        ) {
          shakeControls.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } });
        }
        prevFailedRef.current = i;
        return;
      }
    }
    // If all unlocked rules pass, unlock the next one
    const allUnlockedPass = ruleResults.slice(0, unlockedRules).every((r) => r.passed);

    if (allUnlockedPass && unlockedRules < rules.length) {
      setUnlockedRules(unlockedRules + 1);
    }
  }, [ruleResults, unlockedRules, shakeControls, prefersReducedMotion]);

  const allPassed = unlockedRules >= rules.length && ruleResults.every((r) => r.passed);
  const charCount = password.length;

  useEffect(() => {
    if (allPassed && !prefersReducedMotion) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [allPassed, prefersReducedMotion]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen">
      <Confetti active={showConfetti} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-4xl md:text-5xl font-bold mb-3">
            <GameIcon
              src="/experiences/password-game/icon.webp"
              alt="Password Game icon"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            The Password Game
          </h1>
          <p className="text-[var(--muted-foreground)] text-lg">
            Choose a password that follows all the rules
          </p>
          <div className="mt-4 max-w-md mx-auto">
            <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-400 transition-all duration-500"
                style={{ width: `${(unlockedRules / rules.length) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-[var(--muted-foreground)]">
              <span>
                ⏱️ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </span>
              <span>
                {unlockedRules}/{rules.length} rules
              </span>
            </div>
          </div>
        </div>

        {/* Password Input */}
        <motion.div className="mb-8" animate={shakeControls}>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password-input"
              className="block text-sm font-medium text-[var(--muted-foreground)]"
            >
              Please choose a password
            </label>
            <button
              onClick={handleCopy}
              disabled={!password}
              className="text-xs px-2.5 py-1 rounded-full bg-[var(--secondary)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>
          </div>
          <div className="relative">
            <textarea
              id="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rows={4}
              aria-describedby="char-count"
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 pr-20 text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] transition-colors resize-none font-mono text-sm"
              placeholder="Type your password..."
            />
            <div
              id="char-count"
              className="absolute bottom-3 right-3 text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-1 rounded"
              aria-live="polite"
            >
              {charCount} chars
            </div>
          </div>
        </motion.div>

        {/* Rules — incomplete but discovered on top */}
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            Failed on top • {ruleResults.slice(0, unlockedRules).filter((r) => !r.passed).length} to
            fix
          </span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Failed
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Passed
            </span>
          </span>
        </div>
        <div className="space-y-3" aria-live="polite" aria-atomic="false">
          {[...ruleResults.slice(0, unlockedRules)]
            .sort((a, b) => {
              if (a.passed === b.passed) return a.id - b.id;
              return a.passed ? 1 : -1; // failed first
            })
            .map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-xl p-4 transition-all duration-300 ${
                  rule.passed
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      rule.passed ? "bg-green-500 text-white" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {rule.passed ? "✓" : "✗"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[var(--muted-foreground)] font-mono">
                        Rule {rule.id}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        rule.passed ? "text-green-400" : "text-[var(--foreground)]"
                      }`}
                    >
                      {rule.text}
                    </p>
                    {!rule.passed && rule.hint && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">💡 {rule.hint}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Completion */}
        {allPassed && (
          <div className="mt-12 text-center">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-3xl font-bold text-green-400 mb-2">Congratulations!</h2>
            <p className="text-[var(--muted-foreground)]">
              You have successfully chosen a password in{" "}
              <span className="text-[var(--primary)] font-bold">{charCount}</span> characters.
            </p>
            <p className="text-[var(--muted-foreground)] mt-2 text-sm">
              Good luck remembering that...
            </p>
          </div>
        )}

        {/* Locked Rules Counter */}
        {unlockedRules < rules.length && (
          <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
            {rules.length - unlockedRules} more rule
            {rules.length - unlockedRules !== 1 ? "s" : ""} to discover...
          </div>
        )}
      </div>
    </div>
  );
}
