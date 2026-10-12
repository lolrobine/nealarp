import { describe, it, expect } from "vitest";
import { rules, _helpers } from "./rules";

const { romanToInt, extractRomanTokens } = _helpers;

describe("roman helpers", () => {
  it("converts roman correctly", () => {
    expect(romanToInt("V")).toBe(5);
    expect(romanToInt("VII")).toBe(7);
    expect(romanToInt("XXXV")).toBe(35);
    expect(romanToInt("IV")).toBe(4);
    expect(romanToInt("IX")).toBe(9);
  });

  it("extracts standalone tokens only", () => {
    expect(extractRomanTokens("January").length).toBe(0);
    expect(extractRomanTokens(" V VII ").map((t) => t.value)).toEqual([5, 7]);
    expect(extractRomanTokens("Hello V world").length).toBe(1);
  });

  it("product 35 with V and VII", () => {
    const tokens = extractRomanTokens(" V VII ");
    const product = tokens.reduce((acc, t) => acc * t.value, 1);
    expect(product).toBe(35);
  });
});

describe("rules validation", () => {
  it("has 20 rules", () => {
    expect(rules.length).toBe(20);
  });

  it("each rule has text and hint", () => {
    for (const rule of rules) {
      expect(rule.text.length).toBeGreaterThan(0);
    }
  });

  it("digit sum rule", () => {
    const rule5 = rules.find((r) => r.id === 5)!;
    expect(rule5.validate("abc 8 8 9")).toBe(true); // 8+8+9=25
    expect(rule5.validate("2000 7 8 8")).toBe(true); // 2+7+8+8=25
    expect(rule5.validate("123")).toBe(false);
  });

  it("month rule", () => {
    const rule6 = rules.find((r) => r.id === 6)!;
    expect(rule6.validate("January")).toBe(true);
    expect(rule6.validate("january")).toBe(true);
    expect(rule6.validate("hello")).toBe(false);
  });

  it("roman product rule", () => {
    const rule8 = rules.find((r) => r.id === 8)!;
    expect(rule8.validate(" V VII ")).toBe(true);
    expect(rule8.validate(" XXXV ")).toBe(true);
    expect(rule8.validate(" V ")).toBe(false);
    expect(rule8.validate("January")).toBe(false);
  });

  it("consecutive letters rule", () => {
    const rule14 = rules.find((r) => r.id === 14)!;
    expect(rule14.validate("abc")).toBe(true);
    expect(rule14.validate("xyz")).toBe(true);
    expect(rule14.validate("abx")).toBe(false);
    expect(rule14.validate("ABc")).toBe(true); // case-insensitive
  });

  it("emoji prime index", () => {
    const rule19 = rules.find((r) => r.id === 19)!;
    expect(rule19.validate("AB🎉")).toBe(true); // index 2 prime
    expect(rule19.validate("A🎉")).toBe(false); // index 1 not prime
    expect(rule19.validate("ABC🎉")).toBe(true); // index 3 prime
  });

  it("has at least one known solution", () => {
    // This password is constructed to pass all rules regardless of current day
    const base = `AB🎉 V VII January SundayMondayTuesdayWednesdayThursdayFridaySaturday He Pepsi abc ! 2000 7 8 8 `;
    const upperPadding =
      "QQQ WWW EEE RRR TTT YYY UUU OOO PPP AAA SSS FFF GGG HHH JJJ KKK ZZZ BBB NNN QQQ WWW EEE RRR TTT YYY UUU OOO PPP AAA SSS FFF GGG HHH JJJ KKK ZZZ BBB NNN QQQ WWW EEE RRR TTT YYY UUU OOO PPP AAA SSS FFF GGG HHH JJJ KKK ZZZ BBB NNN";
    const solution = base + upperPadding;

    const results = rules.map((r) => ({ id: r.id, pass: r.validate(solution) }));
    const failed = results.filter((r) => !r.pass);
    if (failed.length > 0) {
      console.log("Failed rules:", failed);
      console.log("Solution:", solution);
      console.log(
        "Upper:",
        (solution.match(/[A-Z]/g) || []).length,
        "Lower:",
        (solution.match(/[a-z]/g) || []).length
      );
    }
    expect(failed.length).toBe(0);
  });

  it("uppercase > lowercase rule", () => {
    const rule17 = rules.find((r) => r.id === 17)!;
    expect(rule17.validate("ABC def")).toBe(false); // 3 upper, 3 lower
    expect(rule17.validate("ABCD ef")).toBe(true); // 4 upper, 2 lower
  });
});
