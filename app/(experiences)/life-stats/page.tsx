"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { lifeStats, statCategories } from "./calculator";

function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const [displayed, setDisplayed] = useState(value);
  const prevValue = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 1000;
    const startTime = Date.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayed(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    prevValue.current = value;

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value]);

  return <>{format(Math.round(displayed))}</>;
}

function getLocalTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return 0;
  const y = parts[0]!;
  const m = parts[1]!;
  const day = parts[2]!;
  // Use local midnight to avoid UTC off-by-one
  return new Date(y, m - 1, day).getTime();
}

export default function LifeStatsPage() {
  const [birthday, setBirthday] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);

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

  const rawAgeMs = birthday ? now - parseLocalDate(birthday) : 0;
  // Clamp to 0 to avoid negative stats for future dates (e.g., devtools bypass)
  const ageMs = Math.max(0, rawAgeMs);

  const filteredStats =
    activeCategory === "all" ? lifeStats : lifeStats.filter((s) => s.category === activeCategory);

  const todayISO = getLocalTodayISO();

  const handleShare = async () => {
    const years = Math.floor(ageMs / 1000 / (365.25 * 24 * 60 * 60));
    const text = `I've been alive for ${years} years! My heart has beaten ${lifeStats
      .find((s) => s.id === "heartbeats")
      ?.getValue(ageMs)
      .toLocaleString()} times. Check your life stats!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Life Stats", text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // fallback
      try {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const avgComparison = (() => {
    const years = ageMs / 1000 / (365.25 * 24 * 60 * 60);
    if (years < 1) return null;
    const pct = Math.min(100, (years / 73) * 100);
    return { pct: pct.toFixed(1), years: years.toFixed(1) };
  })();

  const handleShareAsImage = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr;
    canvas.height = 1000 * dpr;
    ctx.scale(dpr, dpr);
    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 800, 1000);
    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("My Life Stats", 40, 60);
    ctx.fillStyle = "#a3a3a3";
    ctx.font = "16px sans-serif";
    const years = Math.floor(ageMs / 1000 / (365.25 * 24 * 60 * 60));
    ctx.fillText(`Alive for ${years} years • ${birthday}`, 40, 90);
    // Stats
    let y = 140;
    const toShow = lifeStats.slice(0, 12);
    toShow.forEach((stat) => {
      const val = stat.getValue(ageMs);
      const formatted = stat.format(val);
      ctx.fillStyle = "#6366f1";
      ctx.font = "20px sans-serif";
      ctx.fillText(`${stat.emoji} ${stat.label}:`, 40, y);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(formatted, 350, y);
      y += 36;
      if (y > 900) return;
    });
    ctx.fillStyle = "#525252";
    ctx.font = "12px sans-serif";
    ctx.fillText("Generated by neal.fun v2 • nealarp", 40, 980);
    // Download
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-stats-${birthday}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl md:text-6xl font-bold mb-4">
            <GameIcon
              src="/experiences/life-stats/icon.webp"
              alt="Life Stats icon"
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
                max={todayISO}
                aria-label="Your birthday"
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
                aria-pressed={activeCategory === "all"}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
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
                  aria-pressed={activeCategory === cat.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
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
                      <p className="text-sm text-[var(--muted-foreground)] mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-[var(--primary)]">
                        <AnimatedNumber value={stat.getValue(ageMs)} format={stat.format} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison & Share */}
            {avgComparison && (
              <div className="mt-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
                <p className="text-sm text-[var(--muted-foreground)] mb-2">
                  You&apos;ve lived {avgComparison.pct}% of average life expectancy (73y)
                </p>
                <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden max-w-md mx-auto">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-400"
                    style={{ width: `${avgComparison.pct}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  {avgComparison.years} years •{" "}
                  {Math.round(parseFloat(avgComparison.pct) * 0.73 * 365)} days lived
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <button
                onClick={handleShare}
                className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-full text-sm font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {copied ? "✓ Copied!" : "📤 Share my stats"}
              </button>
              <button
                onClick={handleShareAsImage}
                className="px-6 py-2.5 bg-[var(--secondary)] rounded-full text-sm font-medium hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                🖼️ Export as image
              </button>
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
