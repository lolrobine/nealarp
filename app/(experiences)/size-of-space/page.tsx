"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { spaceObjects, categories, formatSize } from "./data";

export default function SizeOfSpacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [baseObject, setBaseObject] = useState<string>("Human");

  const filteredObjects = useMemo(() => {
    const objects = selectedCategory === "all"
      ? spaceObjects
      : spaceObjects.filter((obj) => obj.category === selectedCategory);
    return objects.sort((a, b) => a.size - b.size);
  }, [selectedCategory]);

  const maxSize = Math.max(...spaceObjects.map((o) => o.size));
  const minSize = Math.min(...spaceObjects.map((o) => o.size));

  const baseSize = useMemo(() => {
    const base = spaceObjects.find((o) => o.name === baseObject);
    return base ? base.size : 1.7;
  }, [baseObject]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">🌌 Size of Space</h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            Explore the incredible scale of the universe
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Comparison Mode</span>
            </label>

            {comparisonMode && (
              <select
                value={baseObject}
                onChange={(e) => setBaseObject(e.target.value)}
                className="bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-1 text-sm"
              >
                {spaceObjects.map((obj) => (
                  <option key={obj.name} value={obj.name}>
                    {obj.emoji} {obj.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {comparisonMode && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Shows how many times larger each object is compared to {baseObject}
            </p>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === "all"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            🌟 All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Objects List */}
        <div className="space-y-3">
          {filteredObjects.map((obj, index) => {
              const widthPercent = comparisonMode
                ? Math.min(((obj.size / baseSize) / (maxSize / baseSize)) * 100, 100)
                : ((obj.size - minSize) / (maxSize - minSize)) * 100;
              const multiplier = obj.size / baseSize;
              const isSelected = selectedItem === obj.name;

              return (
                <div
                  key={obj.name}
                  onClick={() => setSelectedItem(isSelected ? null : obj.name)}
                  className="cursor-pointer"
                >
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{obj.emoji}</span>
                        <span className="font-semibold">{obj.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-[var(--primary)]">
                          {formatSize(obj.size)}
                        </div>
                        {comparisonMode && baseObject !== obj.name && (
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {multiplier >= 1
                              ? `${multiplier.toFixed(1)}x larger`
                              : `${(1 / multiplier).toFixed(1)}x smaller`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Size Bar */}
                    <div className="relative h-3 bg-[var(--secondary)] rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(widthPercent, 0.5)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.02 }}
                      />
                    </div>

                    {/* Description */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)]">
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {obj.description}
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
          <p>Click on any object to learn more! Toggle comparison mode to see relative sizes.</p>
        </div>
      </div>
    </div>
  );
}
