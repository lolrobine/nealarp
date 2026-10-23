import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useSpendMoneyStore } from "./store";
import { items, TOTAL_MONEY, type ShopItem } from "./data";

const byPrice = [...items].sort((a, b) => a.price - b.price);

function at(index: number): ShopItem {
  const item = byPrice[index];
  if (!item) throw new Error("the spend-money catalogue is empty");
  return item;
}

const cheapest = at(0);
const dearest = at(byPrice.length - 1);

const STORAGE_KEY = "spend-money-storage";

function state() {
  return useSpendMoneyStore.getState();
}

function remaining() {
  const s = state();
  return s.totalMoney - s.spent;
}

beforeEach(() => {
  useSpendMoneyStore.setState({ purchases: {}, spent: 0 });
  localStorage.removeItem(STORAGE_KEY);
});

afterEach(() => {
  useSpendMoneyStore.setState({ purchases: {}, spent: 0 });
  localStorage.removeItem(STORAGE_KEY);
});

describe("buying and selling", () => {
  it("spends exactly the price of one item per buy", () => {
    state().buy(dearest.id, dearest.price);
    expect(state().purchases[dearest.id]).toBe(1);
    expect(state().spent).toBe(dearest.price);
    expect(remaining()).toBe(TOTAL_MONEY - dearest.price);
  });

  it("refuses a purchase the remaining balance cannot cover", () => {
    useSpendMoneyStore.setState({ purchases: {}, spent: 0 });
    state().setQuantity(cheapest.id, Math.floor(TOTAL_MONEY / cheapest.price), cheapest.price);
    const before = state().purchases[cheapest.id];
    state().buy(dearest.id, dearest.price);
    expect(state().purchases[dearest.id]).toBeUndefined();
    expect(state().purchases[cheapest.id]).toBe(before);
    expect(remaining()).toBeGreaterThanOrEqual(0);
  });

  it("drops the entry entirely when the last one is sold", () => {
    state().buy(dearest.id, dearest.price);
    state().sell(dearest.id, dearest.price);
    expect(dearest.id in state().purchases).toBe(false);
    expect(state().spent).toBe(0);
  });

  it("never sells below zero", () => {
    state().sell(dearest.id, dearest.price);
    state().sell(dearest.id, dearest.price);
    expect(state().spent).toBe(0);
    expect(remaining()).toBe(TOTAL_MONEY);
  });
});

describe("MAX on a cheap item", () => {
  // The quantity used to be capped at a flat billion, so pressing MAX on the
  // cheapest item spent half a percent of the money and the card still looked
  // maxed out. Affordability is the only cap that belongs here.
  it("buys as many as the balance allows, not a fixed ceiling", () => {
    const affordable = Math.floor(TOTAL_MONEY / cheapest.price);
    expect(affordable).toBeGreaterThan(1_000_000_000);

    state().setQuantity(cheapest.id, affordable, cheapest.price);

    expect(state().purchases[cheapest.id]).toBe(affordable);
    expect(state().spent).toBe(affordable * cheapest.price);
  });

  it("clamps an impossible request down to what is affordable", () => {
    state().setQuantity(cheapest.id, Number.MAX_SAFE_INTEGER, cheapest.price);
    expect(state().spent).toBeLessThanOrEqual(TOTAL_MONEY);
    expect(remaining()).toBeGreaterThanOrEqual(0);
    expect(state().purchases[cheapest.id]).toBe(Math.floor(TOTAL_MONEY / cheapest.price));
  });

  it("leaves room for the items already bought", () => {
    state().buy(dearest.id, dearest.price);
    state().setQuantity(cheapest.id, Number.MAX_SAFE_INTEGER, cheapest.price);
    expect(remaining()).toBeGreaterThanOrEqual(0);
    expect(state().purchases[dearest.id]).toBe(1);
  });
});

describe("setQuantity edge cases", () => {
  it("treats a nonsense quantity as zero rather than poisoning the total", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -5]) {
      state().setQuantity(dearest.id, bad, dearest.price);
      expect(dearest.id in state().purchases).toBe(false);
      expect(Number.isFinite(state().spent)).toBe(true);
      expect(state().spent).toBe(0);
    }
  });

  it("rounds a fractional quantity down", () => {
    state().setQuantity(cheapest.id, 3.9, cheapest.price);
    expect(state().purchases[cheapest.id]).toBe(3);
  });

  it("removes the entry when set to zero", () => {
    state().setQuantity(dearest.id, 4, dearest.price);
    state().setQuantity(dearest.id, 0, dearest.price);
    expect(dearest.id in state().purchases).toBe(false);
  });

  it("keeps the balance non-negative across a mixed sequence", () => {
    const order = [...items].sort((a, b) => a.price - b.price);
    for (const item of order) {
      state().setQuantity(item.id, Number.MAX_SAFE_INTEGER, item.price);
      expect(remaining()).toBeGreaterThanOrEqual(0);
      expect(state().spent).toBeLessThanOrEqual(TOTAL_MONEY);
    }
    state().reset();
    expect(state().spent).toBe(0);
    expect(Object.keys(state().purchases)).toHaveLength(0);
  });
});

describe("restoring a saved cart", () => {
  async function rehydrateWith(purchases: unknown, version: number) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { purchases }, version }));
    await useSpendMoneyStore.persist.rehydrate();
  }

  it("keeps a sound cart", async () => {
    await rehydrateWith({ [dearest.id]: 2 }, 1);
    expect(state().purchases[dearest.id]).toBe(2);
    expect(state().spent).toBe(2 * dearest.price);
  });

  it("throws away quantities that are not usable numbers", async () => {
    await rehydrateWith({ [dearest.id]: "lots", [cheapest.id]: Number.NaN, "no-such-item": 3 }, 1);
    expect(Object.keys(state().purchases)).toHaveLength(0);
    expect(state().spent).toBe(0);
  });

  it("sanitizes an older save on migration too", async () => {
    await rehydrateWith({ [dearest.id]: -2, "no-such-item": 9 }, 0);
    expect(Object.keys(state().purchases)).toHaveLength(0);
    expect(state().spent).toBe(0);
  });

  it("recomputes what was spent instead of trusting a stored total", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { purchases: { [dearest.id]: 1 }, spent: 999 }, version: 1 })
    );
    await useSpendMoneyStore.persist.rehydrate();
    expect(state().spent).toBe(dearest.price);
  });
});

describe("a stuck quantity can be cleared", () => {
  it("lets sell remove an entry that is not a usable number", () => {
    useSpendMoneyStore.setState({ purchases: { [dearest.id]: Number.NaN }, spent: 0 });
    state().sell(dearest.id, dearest.price);
    expect(dearest.id in state().purchases).toBe(false);
    expect(state().spent).toBe(0);
  });
});
