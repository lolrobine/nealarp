"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { lifeStats, statCategories } from "./calculator";

function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const [displayed, setDisplayed] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayed(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  return <>{format(Math.round(displayed))}</>;
}

export default function LifeStatsPage() {
  const [birthday, setBirthday] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [now, setNow] = useState(Date.now());

  // Update every second for live counters
  useEffect(() => {
    if (!showStats) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [showStats]);

  const handleCalculate = () => {
    if (birthday) {
      setShowStats(true);
    }
  };

  const ageMs = birthday ? now - new Date(birthday).getTime() : 0;

  const filteredStats = activeCategory === "all"
    ? lifeStats
    : lifeStats.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl md:text-6xl font-bold mb-4">
            <GameIcon
              src="/experiences/life-stats/icon.webp"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            Life Stats
          </h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            Enter your birthday and discover mind-blowing statistics
          </p>
        </div>

        {/* Input */}
        <div className="mb-12">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8">
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-4">
              When were you born?
            </label>
            <div className="flex gap-4 items-center flex-wrap">
              <input
                type="date"
                value={birthday}
                onChange={(e) => {
                  setBirthday(e.target.value);
                  setShowStats(false);
                }}
                max={new Date().toISOString().split("T")[0]}
                className="flex-1 min-w-[200px] bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors"
              />
              <motion.button
                onClick={handleCalculate}
                disabled={!birthday}
                className="px-8 py-3 bg-[var(--primary)] text-white rounded-lg font-medium disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Calculate
              </motion.button>
            </div>
          </div>
        </div>

        {/* Categories */}
        {showStats && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === "all"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                🌟 All
              </button>
              {statCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStats.map((stat) => (
                <div
                  key={stat.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)]/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{stat.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--muted-foreground)] mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-[var(--primary)]">
                        <AnimatedNumber
                          value={stat.getValue(ageMs)}
                          format={stat.format}
                        />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live indicator */}
            <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Numbers update in real-time
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
