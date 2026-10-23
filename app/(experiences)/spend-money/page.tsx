"use client";

import { ChoiceStrip } from "@/lib/components/games/ChoiceStrip";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { useSpendMoneyStore } from "./store";
import { MoneyDisplay } from "./MoneyDisplay";
import { ItemCard } from "./ItemCard";
import { items, categories, TOTAL_MONEY } from "./data";
import { formatMoney } from "./utils";
import { Confetti } from "@/lib/components/Confetti";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export default function SpendMoneyPage() {
  const spent = useSpendMoneyStore((s) => s.spent);
  const purchases = useSpendMoneyStore((s) => s.purchases);
  const reset = useSpendMoneyStore((s) => s.reset);
  const remaining = TOTAL_MONEY - spent;
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const filteredItems = useMemo(() => {
    let list =
      activeCategory === "all" ? items : items.filter((item) => item.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [activeCategory, search, sort]);

  const purchasedItems = useMemo(
    () => items.filter((item) => (purchases[item.id] || 0) > 0),
    [purchases]
  );

  const receiptTotal = useMemo(
    () => purchasedItems.reduce((acc, item) => acc + (purchases[item.id] || 0) * item.price, 0),
    [purchasedItems, purchases]
  );

  const handleExportReceipt = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = 600;
    const lineH = 24;
    const h = 120 + purchasedItems.length * lineH;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("🧾 Receipt — Spend $1 Trillion", 20, 30);
    ctx.font = "12px monospace";
    ctx.fillStyle = "#666";
    ctx.fillText(
      `Total: ${formatMoney(receiptTotal)} • ${new Date().toLocaleDateString()}`,
      20,
      50
    );
    let y = 80;
    ctx.fillStyle = "#000";
    ctx.font = "14px sans-serif";
    purchasedItems.forEach((item) => {
      const qty = purchases[item.id] || 0;
      const line = `${item.emoji} ${item.name} x${qty} — ${formatMoney(item.price * qty)}`;
      ctx.fillText(line, 20, y);
      y += lineH;
    });
    ctx.fillStyle = "#5b5bd6";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`Remaining: ${formatMoney(remaining)}`, 20, y + 10);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipt.png";
    a.click();
  };

  const percentage = (spent / TOTAL_MONEY) * 100;

  // Confetti when crossing 50% or 100%
  const prevPctRef = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion) {
      prevPctRef.current = percentage;
      return;
    }
    const prev = prevPctRef.current;
    if ((prev < 50 && percentage >= 50) || (prev < 100 && percentage >= 100)) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      prevPctRef.current = percentage;
      return () => clearTimeout(t);
    }
    prevPctRef.current = percentage;
  }, [percentage, prefersReducedMotion]);

  return (
    <div className="min-h-screen">
      <Confetti active={showConfetti && !prefersReducedMotion} />
      {/* Money Display */}
      <MoneyDisplay remaining={remaining} spent={spent} total={TOTAL_MONEY} />

      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-4xl md:text-5xl font-bold mb-2">
            <GameIcon
              src="/experiences/spend-money/icon.webp"
              alt="Spend Money icon"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            Spend $1 Trillion
          </h1>
          <p className="text-[var(--muted-foreground)]">
            You have one trillion dollars. Try to spend it all.
          </p>
          {/* Encouragement */}
          {(() => {
            const pct = (spent / TOTAL_MONEY) * 100;
            let msg = "";
            if (pct === 0) msg = "💸 Start spending! Anything you want.";
            else if (pct < 10) msg = "🛒 Nice start! Keep going, you have plenty left.";
            else if (pct < 25) msg = "🔥 You're getting warmed up!";
            else if (pct < 50) msg = "💪 Halfway there? Not even close — keep spending!";
            else if (pct < 75) msg = "🚀 Wow, you're really trying to spend it all!";
            else if (pct < 90) msg = "🤯 Almost there! But $100B is still a lot!";
            else if (pct < 99) msg = "🏁 Final stretch! Can you spend it all?";
            else if (pct < 100) msg = "✨ So close! Just a little more!";
            else msg = "🎉 You did it! You spent $1 trillion!";
            return <p className="mt-3 text-sm font-medium text-[var(--primary)]">{msg}</p>;
          })()}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              aria-label="Search items"
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-full px-5 py-2.5 pr-10 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-sm">
              🔍
            </span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort items"
            className="bg-[var(--card)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
          >
            <option value="default">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* Categories */}
        <ChoiceStrip label="Categories" className="mb-6">
          <motion.button
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              activeCategory === "all"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🌟 All
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                activeCategory === cat.id
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.icon} {cat.name}
            </motion.button>
          ))}
        </ChoiceStrip>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>

        {/* Receipt / Summary */}
        {purchasedItems.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50">
            <motion.button
              onClick={() => setShowReceipt(!showReceipt)}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🧾 Receipt ({purchasedItems.length} items)
            </motion.button>

            {showReceipt && (
              <div className="absolute bottom-14 right-0 w-80 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Your Receipt</h3>
                  <button
                    onClick={() => setShowReceipt(false)}
                    aria-label="Close receipt"
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 mb-4">
                  {purchasedItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm gap-2">
                      <span className="truncate">
                        {item.emoji} {item.name} ×{(purchases[item.id] || 0).toLocaleString()}
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {formatMoney(item.price * (purchases[item.id] || 0))}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--border)] pt-3 space-y-3">
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total spent</span>
                    <span className="text-[var(--primary)]">{formatMoney(receiptTotal)}</span>
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Remaining: {formatMoney(remaining)} • {((spent / TOTAL_MONEY) * 100).toFixed(2)}
                    % spent
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportReceipt}
                      className="flex-1 py-2 bg-[var(--secondary)] rounded-lg text-xs font-medium"
                    >
                      🖼️ Export
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            purchasedItems
                              .map(
                                (i) =>
                                  `${i.emoji} ${i.name} x${purchases[i.id]} = ${formatMoney(i.price * (purchases[i.id] || 0))}`
                              )
                              .join("\n") + `\nTotal: ${formatMoney(receiptTotal)}`
                          );
                        } catch {}
                      }}
                      className="flex-1 py-2 bg-[var(--secondary)] rounded-lg text-xs"
                    >
                      📋 Copy
                    </button>
                  </div>
                  {!showResetConfirm ? (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="w-full py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      Reset Everything
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-center">Are you sure?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            reset();
                            setShowResetConfirm(false);
                            setShowReceipt(false);
                          }}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                        >
                          Yes, reset
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="flex-1 py-2 bg-[var(--secondary)] rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
