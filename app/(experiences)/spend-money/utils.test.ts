import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyFull, formatMoneyShort } from "./utils";
import { items } from "./data";

describe("formatMoney", () => {
  it("switches unit at each thousand-fold boundary", () => {
    expect(formatMoney(999)).toBe("$999");
    expect(formatMoney(1_000)).toBe("$1.0k");
    expect(formatMoney(1_000_000)).toBe("$1.00 million");
    expect(formatMoney(1_000_000_000)).toBe("$1.00 billion");
    expect(formatMoney(1_000_000_000_000)).toBe("$1.00 trillion");
  });

  it("stays just below the boundary in the smaller unit", () => {
    expect(formatMoney(999_999)).toContain("k");
    expect(formatMoney(999_999_999)).toContain("million");
  });

  it("handles zero", () => {
    expect(formatMoney(0)).toBe("$0");
  });
});

describe("formatMoneyShort", () => {
  it("uses single-letter units", () => {
    expect(formatMoneyShort(0)).toBe("$0");
    expect(formatMoneyShort(2_500)).toBe("$3K");
    expect(formatMoneyShort(2_500_000)).toBe("$2.5M");
    expect(formatMoneyShort(2_500_000_000)).toBe("$2.5B");
    expect(formatMoneyShort(2_500_000_000_000)).toBe("$2.5T");
  });
});

describe("formatMoneyFull", () => {
  it("spells the whole number out with separators", () => {
    expect(formatMoneyFull(1_234_567)).toBe(`$${(1234567).toLocaleString()}`);
  });
});

describe("the catalogue of things to buy", () => {
  it("gives every item a unique id", () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it("prices everything above zero, so buying always costs something", () => {
    for (const item of items) {
      expect(item.price, `${item.id} is free`).toBeGreaterThan(0);
      expect(Number.isFinite(item.price)).toBe(true);
    }
  });

  it("names everything", () => {
    for (const item of items) expect(item.name.trim().length).toBeGreaterThan(0);
  });

  it("spans several orders of magnitude, or the game has no arc", () => {
    const prices = items.map((i) => i.price);
    expect(Math.max(...prices) / Math.min(...prices)).toBeGreaterThan(1000);
  });
});
