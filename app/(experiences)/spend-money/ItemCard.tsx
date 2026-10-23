"use client";

import { motion } from "framer-motion";
import { formatMoney } from "./utils";
import { useSpendMoneyStore } from "./store";
import type { ShopItem } from "./data";
import { useState, memo, useMemo } from "react";

interface ItemCardProps {
  item: ShopItem;
}

function ItemCardComponent({ item }: ItemCardProps) {
  // Use selectors to avoid re-rendering all cards on any purchase
  const quantity = useSpendMoneyStore((s) => s.purchases[item.id] || 0);
  const spent = useSpendMoneyStore((s) => s.spent);
  const totalMoney = useSpendMoneyStore((s) => s.totalMoney);
  const buy = useSpendMoneyStore((s) => s.buy);
  const sell = useSpendMoneyStore((s) => s.sell);
  const setQuantity = useSpendMoneyStore((s) => s.setQuantity);

  const remaining = totalMoney - spent;
  const canAfford = remaining >= item.price;
  const maxAffordable = useMemo(
    () => quantity + Math.max(0, Math.floor(remaining / item.price)),
    [quantity, remaining, item.price]
  );

  const [customQty, setCustomQty] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleBuy = () => {
    buy(item.id, item.price);
  };

  const handleSell = () => {
    sell(item.id, item.price);
  };

  const handleMaxBuy = () => {
    setQuantity(item.id, maxAffordable, item.price);
  };

  const handleCustomSubmit = () => {
    const qty = parseInt(customQty);
    if (!isNaN(qty) && qty >= 0) {
      setQuantity(item.id, qty, item.price);
    }
    setCustomQty("");
    setShowInput(false);
  };

  return (
    <div
      className={`relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 transition-all duration-200 ${
        !canAfford && quantity === 0 ? "opacity-50" : "hover:border-[var(--primary)]/50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className="text-3xl flex-shrink-0">{item.emoji}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{item.name}</h3>
          <p className="text-[var(--primary)] font-bold text-sm">{formatMoney(item.price)}</p>
        </div>

        {/* Quantity & Controls */}
        <div className="flex flex-col items-end gap-1">
          {quantity > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full font-bold"
            >
              ×{quantity.toLocaleString()}
            </motion.span>
          )}

          <div className="flex items-center gap-1">
            {/* Sell */}
            <motion.button
              onClick={handleSell}
              disabled={quantity === 0}
              aria-label={`Sell one ${item.name}`}
              className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-lg font-bold disabled:opacity-30 hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              −
            </motion.button>

            {/* Buy */}
            <motion.button
              onClick={handleBuy}
              disabled={!canAfford}
              aria-label={`Buy one ${item.name}`}
              className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-lg font-bold disabled:opacity-30 hover:bg-[var(--primary)]/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              +
            </motion.button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {quantity >= 0 && (canAfford || quantity > 0) && (
        <div className="flex gap-1 mt-2">
          <button
            onClick={handleMaxBuy}
            disabled={!canAfford}
            className="flex-1 text-xs py-1 rounded-md bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
          >
            MAX
          </button>
          <button
            onClick={() => setShowInput(!showInput)}
            className="flex-1 text-xs py-1 rounded-md bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            SET
          </button>
        </div>
      )}

      {/* Custom Quantity Input */}
      {showInput && (
        <div className="mt-2 flex gap-1">
          <input
            type="number"
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            placeholder="Quantity..."
            min="0"
            aria-label={`Set quantity for ${item.name}`}
            className="flex-1 text-xs bg-[var(--secondary)] border border-[var(--border)] rounded-md px-2 py-1 outline-none focus:border-[var(--primary)]"
            autoFocus
          />
          <button
            onClick={handleCustomSubmit}
            aria-label={`Confirm quantity for ${item.name}`}
            className="text-xs px-2 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md"
          >
            Go
          </button>
        </div>
      )}
    </div>
  );
}

export const ItemCard = memo(ItemCardComponent);
