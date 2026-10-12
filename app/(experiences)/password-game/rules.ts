export type Rule = {
  id: number;
  text: string;
  validate: (password: string) => boolean;
  hint: string;
};

// --- Roman numeral helpers ---
const ROMAN_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

function romanToInt(s: string): number {
  let total = 0;
  let prev = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    const ch = s[i]!;
    const val = ROMAN_VALUES[ch];
    if (!val) return 0; // invalid char
    if (val < prev) {
      total -= val;
    } else {
      total += val;
      prev = val;
    }
  }
  // Basic validation: reconvert and check if it matches common patterns?
  // For simplicity, accept any that yields >0 and is <4000 and doesn't have 4 repeats
  if (total <= 0 || total >= 4000) return 0;
  // Check invalid repetition (IIII, XXXX, etc)
  if (/(IIII|XXXX|CCCC|MMMM)/.test(s)) return 0;
  return total;
}

function extractRomanTokens(password: string): { token: string; value: number }[] {
  // Match standalone tokens of IVXLCDM surrounded by word boundaries or non-letters
  // Using \b[IVXLCDM]+\b ensures we don't catch letters inside words like January
  const matches = password.match(/\b[IVXLCDM]+\b/g);
  if (!matches) return [];
  const result: { token: string; value: number }[] = [];
  for (const token of matches) {
    const value = romanToInt(token);
    if (value > 0) result.push({ token, value });
  }
  return result;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export const rules: Rule[] = [
  {
    id: 1,
    text: "Your password must be at least 5 characters long",
    validate: (p) => p.length >= 5,
    hint: "Just type 5 or more characters!",
  },
  {
    id: 2,
    text: "Your password must contain a number",
    validate: (p) => /\d/.test(p),
    hint: "Any digit will do: 0-9",
  },
  {
    id: 3,
    text: "Your password must contain an uppercase letter",
    validate: (p) => /[A-Z]/.test(p),
    hint: "Capitalize something!",
  },
  {
    id: 4,
    text: "Your password must contain a special character",
    validate: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
    hint: "Try !, @, #, $, %, ^, &, or *",
  },
  {
    id: 5,
    text: "The digits in your password must add up to 25",
    validate: (p) => {
      const digits = p.match(/\d/g);
      if (!digits) return false;
      const sum = digits.reduce((acc, d) => acc + parseInt(d, 10), 0);
      return sum === 25;
    },
    hint: "e.g., 8 + 8 + 9 = 25. Include all digits in sum!",
  },
  {
    id: 6,
    text: "Your password must contain a month of the year",
    validate: (p) => {
      const months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];
      const lower = p.toLowerCase();
      return months.some((m) => lower.includes(m));
    },
    hint: "Like 'January', 'March', 'October'...",
  },
  {
    id: 7,
    text: "Your password must contain a Roman numeral (as a standalone word)",
    validate: (p) => extractRomanTokens(p).length > 0,
    hint: "Try V, VII, X, L, C, D, M as separate words — e.g., ' V '",
  },
  {
    id: 8,
    text: "The Roman numerals in your password should multiply to 35",
    validate: (p) => {
      const tokens = extractRomanTokens(p);
      if (tokens.length === 0) return false;
      const product = tokens.reduce((acc, t) => acc * t.value, 1);
      return product === 35;
    },
    hint: "V × VII = 35. Include ' V VII ' as separate words (5×7=35). Extra I's (value 1) are okay.",
  },
  {
    id: 9,
    text: "Your password must include the current day of the week",
    validate: (p) => {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ] as const;
      const today = days[new Date().getDay()]!;
      return p.includes(today);
    },
    hint: "Today is the day! Check what day it is, or include all days to be safe.",
  },
  {
    id: 10,
    text: "Your password must contain a two-letter chemical element symbol",
    validate: (p) => {
      const elements = [
        "He",
        "Li",
        "Be",
        "Ne",
        "Na",
        "Mg",
        "Al",
        "Si",
        "Cl",
        "Ar",
        "Ca",
        "Sc",
        "Ti",
        "Cr",
        "Mn",
        "Fe",
        "Co",
        "Ni",
        "Cu",
        "Zn",
        "Ga",
        "Ge",
        "As",
        "Se",
        "Br",
        "Kr",
        "Sr",
        "Zr",
        "Nb",
        "Mo",
        "Tc",
        "Ru",
        "Rh",
        "Pd",
        "Ag",
        "Cd",
        "In",
        "Sn",
        "Sb",
        "Te",
        "Xe",
        "Cs",
        "Ba",
        "La",
        "Ce",
        "Pr",
        "Nd",
        "Pm",
        "Sm",
        "Eu",
        "Gd",
        "Tb",
        "Dy",
        "Ho",
        "Er",
        "Tm",
        "Yb",
        "Lu",
        "Hf",
        "Ta",
        "Re",
        "Os",
        "Ir",
        "Pt",
        "Au",
        "Hg",
        "Tl",
        "Pb",
        "Bi",
        "Po",
        "At",
        "Rn",
        "Fr",
        "Ra",
        "Ac",
        "Th",
        "Pa",
        "Np",
        "Pu",
        "Am",
        "Cm",
        "Bk",
        "Cf",
        "Es",
        "Fm",
        "Md",
        "No",
        "Lr",
        "Rf",
        "Db",
        "Sg",
        "Bh",
        "Hs",
        "Mt",
        "Ds",
        "Rg",
        "Cn",
        "Nh",
        "Fl",
        "Mc",
        "Lv",
        "Ts",
        "Og",
      ];
      return elements.some((el) => p.includes(el));
    },
    hint: "Like 'He' (Helium), 'Au' (Gold), 'Fe' (Iron)...",
  },
  {
    id: 11,
    text: "Your password must contain a leap year",
    validate: (p) => {
      const years = p.match(/\d{4}/g);
      if (!years) return false;
      return years.some((y) => {
        const year = parseInt(y, 10);
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      });
    },
    hint: "2000, 2004, 2024 are leap years!",
  },
  {
    id: 12,
    text: "Your password must contain 🎉",
    validate: (p) => p.includes("🎉"),
    hint: "Copy this emoji: 🎉",
  },
  {
    id: 13,
    text: "Your password must be at least 50 characters long",
    validate: (p) => p.length >= 50,
    hint: "Almost there... just 50 characters!",
  },
  {
    id: 14,
    text: "Your password must contain 3 consecutive letters in alphabetical order (like abc or xyz)",
    validate: (p) => {
      const lower = p.toLowerCase();
      for (let i = 0; i < lower.length - 2; i++) {
        const a = lower.charCodeAt(i);
        const b = lower.charCodeAt(i + 1);
        const c = lower.charCodeAt(i + 2);
        // Check a,b,c are letters a-z
        if (a < 97 || a > 122) continue;
        if (b < 97 || b > 122) continue;
        if (c < 97 || c > 122) continue;
        if (b === a + 1 && c === b + 1) return true;
      }
      return false;
    },
    hint: "Include 'abc', 'bcd', 'xyz', etc. somewhere!",
  },
  {
    id: 15,
    text: "Your password must contain a prime number",
    validate: (p) => {
      const numbers = p.match(/\d+/g);
      if (!numbers) return false;
      return numbers.some((n) => isPrime(parseInt(n, 10)));
    },
    hint: "2, 3, 5, 7, 11, 13, 17, 19, 23...",
  },
  {
    id: 16,
    text: "Your password must contain one of our sponsors' names: 'Pepsi'",
    validate: (p) => p.includes("Pepsi"),
    hint: "Just add Pepsi somewhere!",
  },
  {
    id: 17,
    text: "Your password must have more uppercase than lowercase",
    validate: (p) => {
      const upper = (p.match(/[A-Z]/g) || []).length;
      const lower = (p.match(/[a-z]/g) || []).length;
      return upper > lower;
    },
    hint: "Add lots of UPPERCASE LETTERS to outweigh lowercase!",
  },
  {
    id: 18,
    text: "Your password must be at least 100 characters long",
    validate: (p) => p.length >= 100,
    hint: "Keep going... 100 characters!",
  },
  {
    id: 19,
    text: "The 🎉 emoji in your password must be positioned at a prime index (counting characters, starting at 0)",
    validate: (p) => {
      // Use Array.from to handle emoji correctly (grapheme-aware)
      const chars = Array.from(p);
      const idx = chars.indexOf("🎉");
      if (idx === -1) return false;
      return isPrime(idx);
    },
    hint: "Position 2, 3, 5, 7, 11, 13, etc. (character count, not code units)",
  },
  {
    id: 20,
    text: "Congratulations! You have chosen a valid password!",
    validate: () => true,
    hint: "",
  },
];

// Export helpers for testing
export const _helpers = {
  romanToInt,
  extractRomanTokens,
  isPrime,
};
