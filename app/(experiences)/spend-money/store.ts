import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { items } from "./data";

// Build price lookup for spent calculation
const priceMap = new Map<string, number>(items.map((i) => [i.id, i.price]));

function calculateSpent(purchases: Record<string, number>): number {
  let total = 0;
  for (const [id, qty] of Object.entries(purchases)) {
    const price = priceMap.get(id);
    if (price === undefined) continue;
    // Guard against overflow and against a tampered or corrupt stored
    // quantity. NaN used to survive both Math.min and Math.max and poison the
    // total, which then tripped the Infinity guard below and reported the
    // player as having spent everything.
    const safeQty = Number.isFinite(qty) ? Math.max(0, Math.min(qty, Number.MAX_SAFE_INTEGER)) : 0;
    total += safeQty * price;
    // Prevent Infinity
    if (!Number.isFinite(total)) return Number.MAX_SAFE_INTEGER;
  }
  return total;
}

// Persisted quantities come straight from localStorage, so they can be
// anything: a string, NaN, a negative number, or the id of an item that no
// longer exists in the catalogue. An unusable quantity used to survive the
// round trip and render as "xNaN" on a card that nothing could clear, because
// sell() compares NaN and every comparison is false.
function sanitizePurchases(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const clean: Record<string, number> = {};
  for (const [id, qty] of Object.entries(raw as Record<string, unknown>)) {
    if (!priceMap.has(id)) continue;
    const n = typeof qty === "number" ? Math.floor(qty) : Number.NaN;
    if (!Number.isFinite(n) || n < 1) continue;
    clean[id] = Math.min(n, Number.MAX_SAFE_INTEGER);
  }
  return clean;
}

interface SpendMoneyState {
  totalMoney: number;
  purchases: Record<string, number>;
  // Derived, not persisted directly — kept for convenience but recalculated on rehydrate
  spent: number;
  buy: (itemId: string, price: number) => void;
  sell: (itemId: string, price: number) => void;
  setQuantity: (itemId: string, quantity: number, price: number) => void;
  reset: () => void;
  _recalculate: () => void;
}

export const useSpendMoneyStore = create<SpendMoneyState>()(
  persist(
    (set, get) => ({
      totalMoney: 1_000_000_000_000,
      purchases: {},
      spent: 0,

      buy: (itemId: string, price: number) => {
        const { totalMoney, purchases } = get();
        const spent = calculateSpent(purchases);
        if (totalMoney - spent < price) return;

        const newPurchases = { ...purchases };
        const current = newPurchases[itemId] || 0;
        // Prevent overflow
        if (current >= Number.MAX_SAFE_INTEGER) return;
        newPurchases[itemId] = current + 1;

        set({
          purchases: newPurchases,
          spent: calculateSpent(newPurchases),
        });
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sell: (itemId: string, _price: number) => {
        const { purchases } = get();
        const currentQty = purchases[itemId] || 0;
        if (!Number.isFinite(currentQty) || currentQty <= 0) {
          if (!(itemId in purchases)) return;
          const cleared = { ...purchases };
          delete cleared[itemId];
          set({ purchases: cleared, spent: calculateSpent(cleared) });
          return;
        }

        const newPurchases = { ...purchases };
        if (currentQty <= 1) {
          delete newPurchases[itemId];
        } else {
          newPurchases[itemId] = currentQty - 1;
        }

        set({
          purchases: newPurchases,
          spent: calculateSpent(newPurchases),
        });
      },

      setQuantity: (itemId: string, quantity: number, price: number) => {
        const { totalMoney, purchases } = get();
        // Sanitize quantity
        let q = Math.floor(quantity);
        if (!Number.isFinite(q) || q < 0) q = 0;
        if (q > Number.MAX_SAFE_INTEGER) q = Number.MAX_SAFE_INTEGER;

        const currentQty = purchases[itemId] || 0;
        const spent = calculateSpent(purchases);
        const currentItemSpent = currentQty * price;
        const spentWithoutThis = spent - currentItemSpent;

        // Check affordability for increase
        if (q > currentQty) {
          if (!Number.isFinite(price) || price <= 0) return;
          // The affordability clamp is what keeps the arithmetic in range: the
          // most anyone can hold is totalMoney / price, far below
          // MAX_SAFE_INTEGER for every price in the catalogue. A flat quantity
          // cap on top of it only made "MAX" stop short on cheap items.
          const maxAffordableQty = Math.floor((totalMoney - spentWithoutThis) / price);
          if (q > maxAffordableQty) {
            q = Math.max(currentQty, maxAffordableQty);
          }
        }

        const newPurchases = { ...purchases };
        if (q <= 0) {
          delete newPurchases[itemId];
        } else {
          newPurchases[itemId] = q;
        }

        set({
          purchases: newPurchases,
          spent: calculateSpent(newPurchases),
        });
      },

      reset: () => {
        set({ purchases: {}, spent: 0 });
      },

      _recalculate: () => {
        const { purchases } = get();
        set({ spent: calculateSpent(purchases) });
      },
    }),
    {
      name: "spend-money-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ purchases: state.purchases }) as unknown as SpendMoneyState,
      // Migrate old persisted state that had spent
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate spent from purchases to fix desync
          state.purchases = sanitizePurchases(state.purchases);
          state.spent = calculateSpent(state.purchases);
        }
      },
      version: 1,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      migrate: (persisted: unknown, _version: number) => {
        // Drop old spent field, keep only purchases
        if (persisted && typeof persisted === "object" && "purchases" in persisted) {
          const p = persisted as { purchases?: unknown };
          const purchases = sanitizePurchases(p.purchases);
          return {
            totalMoney: 1_000_000_000_000,
            purchases,
            spent: calculateSpent(purchases),
          } as SpendMoneyState;
        }
        return persisted as SpendMoneyState;
      },
    }
  )
);

// Selector helpers for components to avoid re-rendering all cards
export const useSpent = () => useSpendMoneyStore((s) => s.spent);
export const useRemaining = () => useSpendMoneyStore((s) => s.totalMoney - s.spent);
export const usePurchaseQuantity = (id: string) => useSpendMoneyStore((s) => s.purchases[id] || 0);
