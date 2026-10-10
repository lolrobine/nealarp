"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { rules } from "./rules";

export default function PasswordGamePage() {
  const [password, setPassword] = useState("");
  const [unlockedRules, setUnlockedRules] = useState(1);

  // Evaluate all rules
  const ruleResults = useMemo(() => {
    return rules.map((rule) => ({
      ...rule,
      passed: rule.validate(password),
    }));
  }, [password]);

  // Unlock new rules as previous ones are satisfied
  useEffect(() => {
    for (let i = 0; i < unlockedRules && i < rules.length; i++) {
      if (!ruleResults[i].passed) return;
    }
    // If all unlocked rules pass, unlock the next one
    const allUnlockedPass = ruleResults
      .slice(0, unlockedRules)
      .every((r) => r.passed);

    if (allUnlockedPass && unlockedRules < rules.length) {
      setUnlockedRules(unlockedRules + 1);
    }
  }, [ruleResults, unlockedRules]);

  const allPassed = unlockedRules >= rules.length && ruleResults.every((r) => r.passed);
  const charCount = password.length;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            🔐 The Password Game
          </h1>
          <p className="text-[var(--muted-foreground)] text-lg">
            Choose a password that follows all the rules
          </p>
        </motion.div>

        {/* Password Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
            Please choose a password
          </label>
          <div className="relative">
            <textarea
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rows={4}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 pr-20 text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors resize-none font-mono text-sm"
              placeholder="Type your password..."
            />
            <div className="absolute bottom-3 right-3 text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-1 rounded">
              {charCount} chars
            </div>
          </div>
        </motion.div>

        {/* Rules */}
        <div className="space-y-3">
          <AnimatePresence>
            {ruleResults.slice(0, unlockedRules).map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className={`border rounded-xl p-4 transition-all duration-300 ${
                  rule.passed
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      rule.passed
                        ? "bg-green-500 text-white"
                        : "bg-red-500/20 text-red-400"
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
                        rule.passed
                          ? "text-green-400"
                          : "text-[var(--foreground)]"
                      }`}
                    >
                      {rule.text}
                    </p>
                    {!rule.passed && rule.hint && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs text-[var(--muted-foreground)] mt-1"
                      >
                        💡 {rule.hint}
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Completion */}
        <AnimatePresence>
          {allPassed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mt-12 text-center"
            >
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
              <h2 className="text-3xl font-bold text-green-400 mb-2">
                Congratulations!
              </h2>
              <p className="text-[var(--muted-foreground)]">
                You have successfully chosen a password in{" "}
                <span className="text-[var(--primary)] font-bold">
                  {charCount}
                </span>{" "}
                characters.
              </p>
              <p className="text-[var(--muted-foreground)] mt-2 text-sm">
                Good luck remembering that...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Locked Rules Counter */}
        {unlockedRules < rules.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center text-sm text-[var(--muted-foreground)]"
          >
            {rules.length - unlockedRules} more rule
            {rules.length - unlockedRules !== 1 ? "s" : ""} to discover...
          </motion.div>
        )}
      </div>
    </div>
  );
}
