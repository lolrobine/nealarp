"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSpendMoneyStore } from "./store";
import { MoneyDisplay } from "./MoneyDisplay";
import { ItemCard } from "./ItemCard";
import { items, categories, TOTAL_MONEY } from "./data";

export default function SpendMoneyPage() {
  const { spent, purchases, reset } = useSpendMoneyStore();
  const remaining = TOTAL_MONEY - spent;
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showReceipt, setShowReceipt] = useState(false);

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category === activeCategory);

  const purchasedItems = items.filter(
    (item) => (purchases[item.id] || 0) > 0
  );

  return (
    <div className="min-h-screen">
      {/* Money Display */}
      <MoneyDisplay
        remaining={remaining}
        spent={spent}
        total={TOTAL_MONEY}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            💰 Spend $1 Trillion
          </h1>
          <p className="text-[var(--muted-foreground)]">
            You have one trillion dollars. Try to spend it all.
          </p>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <motion.button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === "all"
                ? "bg-[var(--primary)] text-white"
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
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.icon} {cat.name}
            </motion.button>
          ))}
        </div>

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
              className="bg-[var(--primary)] text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2"
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
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 mb-4">
                  {purchasedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="truncate">
                        {item.emoji} {item.name} ×
                        {(purchases[item.id] || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--border)] pt-2">
                  <button
                    onClick={reset}
                    className="w-full py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Reset Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
