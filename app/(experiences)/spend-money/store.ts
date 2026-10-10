import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SpendMoneyState {
  totalMoney: number;
  purchases: Record<string, number>; // itemId -> quantity
  spent: number;
  buy: (itemId: string, price: number) => void;
  sell: (itemId: string, price: number) => void;
  setQuantity: (itemId: string, quantity: number, price: number) => void;
  reset: () => void;
}

export const useSpendMoneyStore = create<SpendMoneyState>()(
  persist(
    (set, get) => ({
      totalMoney: 1_000_000_000_000,
      purchases: {},
      spent: 0,

      buy: (itemId: string, price: number) => {
        const { totalMoney, purchases, spent } = get();
        if (totalMoney - spent < price) return;

        const newPurchases = { ...purchases };
        newPurchases[itemId] = (newPurchases[itemId] || 0) + 1;

        set({
          purchases: newPurchases,
          spent: spent + price,
        });
      },

      sell: (itemId: string, price: number) => {
        const { purchases, spent } = get();
        const currentQty = purchases[itemId] || 0;
        if (currentQty <= 0) return;

        const newPurchases = { ...purchases };
        newPurchases[itemId] = currentQty - 1;
        if (newPurchases[itemId] === 0) delete newPurchases[itemId];

        set({
          purchases: newPurchases,
          spent: Math.max(0, spent - price),
        });
      },

      setQuantity: (itemId: string, quantity: number, price: number) => {
        const { totalMoney, purchases, spent } = get();
        const currentQty = purchases[itemId] || 0;
        const diff = quantity - currentQty;
        const cost = diff * price;

        if (diff > 0 && spent + cost > totalMoney) {
          // Can't afford it - set to max affordable
          const maxAffordable = Math.floor((totalMoney - spent) / price) + currentQty;
          const actualDiff = maxAffordable - currentQty;
          if (actualDiff <= 0) return;

          const newPurchases = { ...purchases };
          newPurchases[itemId] = maxAffordable;

          set({
            purchases: newPurchases,
            spent: spent + actualDiff * price,
          });
          return;
        }

        const newPurchases = { ...purchases };
        if (quantity <= 0) {
          delete newPurchases[itemId];
        } else {
          newPurchases[itemId] = quantity;
        }

        set({
          purchases: newPurchases,
          spent: Math.max(0, spent + cost),
        });
      },

      reset: () => {
        set({ purchases: {}, spent: 0 });
      },
    }),
    {
      name: "spend-money-storage",
    }
  )
);
