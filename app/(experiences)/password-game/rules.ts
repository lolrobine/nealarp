export type Rule = {
  id: number;
  text: string;
  validate: (password: string) => boolean;
  hint: string;
};

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
      const sum = digits.reduce((acc, d) => acc + parseInt(d), 0);
      return sum === 25;
    },
    hint: "e.g., 8 + 8 + 9 = 25",
  },
  {
    id: 6,
    text: "Your password must contain a month of the year",
    validate: (p) => {
      const months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december",
      ];
      const lower = p.toLowerCase();
      return months.some((m) => lower.includes(m));
    },
    hint: "Like 'January', 'March', 'October'...",
  },
  {
    id: 7,
    text: "Your password must contain a Roman numeral",
    validate: (p) => /[IVXLCDM]/.test(p),
    hint: "I, V, X, L, C, D, or M",
  },
  {
    id: 8,
    text: "The Roman numerals in your password should multiply to 35",
    validate: (p) => {
      const romanValues: Record<string, number> = {
        I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
      };
      const romans = p.match(/[IVXLCDM]/g);
      if (!romans) return false;
      const product = romans.reduce((acc, r) => acc * (romanValues[r] || 0), 1);
      return product === 35;
    },
    hint: "V × VII = 35. That's V and VII.",
  },
  {
    id: 9,
    text: "Your password must include the current day of the week",
    validate: (p) => {
      const days = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday",
      ];
      const today = days[new Date().getDay()];
      return p.includes(today);
    },
    hint: "Today is the day! Check what day it is.",
  },
  {
    id: 10,
    text: "Your password must contain a two-letter chemical element symbol",
    validate: (p) => {
      const elements = [
        "He", "Li", "Be", "Ne", "Na", "Mg", "Al", "Si", "Cl", "Ar",
        "Ca", "Sc", "Ti", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
        "Ga", "Ge", "As", "Se", "Br", "Kr", "Sr", "Zr", "Nb", "Mo",
        "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te",
        "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu",
        "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta",
        "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po",
        "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "Np", "Pu", "Am",
        "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db",
        "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc",
        "Lv", "Ts", "Og",
      ];
      return elements.some((el) => p.includes(el));
    },
    hint: "Like 'He' (Helium), 'Au' (Gold), 'Fe' (Iron)...",
  },
  {
    id: 11,
    text: "Your password must contain a leap year",
    validate: (p) => {
      // Match 4-digit numbers and check if any is a leap year
      const years = p.match(/\d{4}/g);
      if (!years) return false;
      return years.some((y) => {
        const year = parseInt(y);
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
    text: "The letters in your password must be in alphabetical order",
    validate: (p) => {
      const letters = p.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (letters.length === 0) return false;
      for (let i = 1; i < letters.length; i++) {
        if (letters[i] < letters[i - 1]) return false;
      }
      return true;
    },
    hint: "Each letter must be the same or later in the alphabet than the previous one. 'abce' is valid, 'ba' is not.",
  },
  {
    id: 15,
    text: "Your password must contain a prime number",
    validate: (p) => {
      const numbers = p.match(/\d+/g);
      if (!numbers) return false;
      const isPrime = (n: number) => {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (let i = 3; i <= Math.sqrt(n); i += 2) {
          if (n % i === 0) return false;
        }
        return true;
      };
      return numbers.some((n) => isPrime(parseInt(n)));
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
    hint: "Capitalize more letters!",
  },
  {
    id: 18,
    text: "Your password must be at least 100 characters long",
    validate: (p) => p.length >= 100,
    hint: "Keep going... 100 characters!",
  },
  {
    id: 19,
    text: "The 🎉 emoji in your password must be positioned at a prime index",
    validate: (p) => {
      const idx = p.indexOf("🎉");
      if (idx === -1) return false;
      const isPrime = (n: number) => {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (let i = 3; i <= Math.sqrt(n); i += 2) {
          if (n % i === 0) return false;
        }
        return true;
      };
      return isPrime(idx);
    },
    hint: "Position 2, 3, 5, 7, 11, 13, etc.",
  },
  {
    id: 20,
    text: "Congratulations! You have chosen a valid password!",
    validate: () => true,
    hint: "",
  },
];
