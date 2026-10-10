"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { speedItems, categories, formatSpeed } from "./data";

export default function SpeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const filteredItems = useMemo(() => {
    const items = selectedCategory === "all"
      ? speedItems
      : speedItems.filter((item) => item.category === selectedCategory);
    return items.sort((a, b) => a.speed - b.speed);
  }, [selectedCategory]);

  const maxSpeed = Math.max(...speedItems.map((i) => i.speed));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">⚡ Speed</h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            Compare the speed of everything
          </p>
        </div>

        {/* Speed Multiplier */}
        <div className="mb-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <label className="block text-sm font-medium mb-3">
            Time Multiplier: {speedMultiplier}x
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <motion.button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === "all"
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
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.emoji} {cat.name}
            </motion.button>
          ))}
        </div>

        {/* Speed Visualization */}
        <div className="space-y-3">
          {filteredItems.map((item, index) => {
              const widthPercent = (item.speed / maxSpeed) * 100;
              const isSelected = selectedItem === item.name;

              return (
                <div
                  key={item.name}
                  onClick={() => setSelectedItem(isSelected ? null : item.name)}
                  className="cursor-pointer"
                >
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <span className="text-sm font-mono text-[var(--primary)]">
                        {formatSpeed(item.speed * speedMultiplier)}
                      </span>
                    </div>

                    {/* Speed Bar */}
                    <div className="relative h-3 bg-[var(--secondary)] rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(widthPercent, 0.5)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.02 }}
                      />
                    </div>

                    {/* Fun Fact */}
                    {isSelected && item.funFact && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)]">
                        <p className="text-sm text-[var(--muted-foreground)]">
                          💡 {item.funFact}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Info */}
        <div className="mt-12 text-center text-sm text-[var(--muted-foreground)]">
          <p>Click on any item to see fun facts!</p>
        </div>
      </div>
    </div>
  );
}
