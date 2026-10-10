"use client";

import { motion } from "framer-motion";
import { formatMoneyFull } from "./utils";

interface MoneyDisplayProps {
  remaining: number;
  spent: number;
  total: number;
}

export function MoneyDisplay({ remaining, spent, total }: MoneyDisplayProps) {
  const percentage = (spent / total) * 100;

  return (
    <div className="sticky top-16 z-40 bg-[var(--background)] border-b border-[var(--border)] py-4 px-4">
      <div className="container mx-auto">
        {/* Remaining */}
        <motion.div
          className="text-center mb-3"
          key={remaining}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
            Remaining
          </span>
          <div className="text-3xl md:text-4xl font-bold text-[var(--primary)]">
            <span>{formatMoneyFull(remaining)}</span>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
            <span>Spent: {formatMoneyFull(spent)}</span>
            <span>{percentage.toFixed(4)}%</span>
          </div>
          <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
              animate={{ width: `${Math.max(percentage, 0.1)}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
