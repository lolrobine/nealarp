export type ClueLevel = {
  id: string;
  answer: string;
  enumeration: string;
  clue: string;
  /** Plain-language wordplay walk-through, shown only on request. */
  annotation: string;
  device: string;
};

/** Original cryptic clues written for this app; devices follow standard cryptic
 * conventions (anagram, hidden word, charade, double definition) but no clue text
 * is taken from other publications. */
export const CLUES: ClueLevel[] = [
  {
    id: "planet",
    answer: "PLANET",
    enumeration: "(6)",
    clue: "Celestial body is part of planetoid",
    annotation:
      'Hidden word: PLANET sits at the start of "planetoid". "Part of" signals the hidden word, "celestial body" is the definition.',
    device: "hidden",
  },
  {
    id: "rocket",
    answer: "ROCKET",
    enumeration: "(6)",
    clue: "Rise fast in a launch vehicle",
    annotation:
      "Double definition: to rocket is to rise fast; a rocket is a launch vehicle. Both halves define the same answer.",
    device: "double definition",
  },
  {
    id: "arcade",
    answer: "ARCADE",
    enumeration: "(6)",
    clue: 'Fun hall after "a raced" stirred wildly',
    annotation:
      'Anagram: the fodder "A RACED" is rearranged ("stirred wildly") into ARCADE. "Fun hall" is the definition.',
    device: "anagram",
  },
  {
    id: "ticket",
    answer: "TICKET",
    enumeration: "(6)",
    clue: "Fine way to get a pass",
    annotation:
      "Double definition: a ticket is a fine (parking ticket); a ticket is also a pass that gets you in.",
    device: "double definition",
  },
  {
    id: "basket",
    answer: "BASKET",
    enumeration: "(6)",
    clue: "Container is part of basketball court",
    annotation:
      'Hidden word: BASKET hides at the start of "basketball". "Part of" signals the hidden word, "container" is the definition.',
    device: "hidden",
  },
  {
    id: "orchard",
    answer: "ORCHARD",
    enumeration: "(7)",
    clue: "Fruit garden is part of torch ardent",
    annotation:
      'Hidden word: ORCHARD runs across "torch ardent" (torch ardent → t-ORCHARD-ent). "Part of" signals it, "fruit garden" is the definition.',
    device: "hidden",
  },
  {
    id: "parsnip",
    answer: "PARSNIP",
    enumeration: "(7)",
    clue: 'Mashed "spar pin" makes a root vegetable',
    annotation:
      'Anagram: the fodder "SPAR PIN" is rearranged ("mashed") into PARSNIP. "Root vegetable" is the definition.',
    device: "anagram",
  },
  {
    id: "compass",
    answer: "COMPASS",
    enumeration: "(7)",
    clue: "Company pass showing the way",
    annotation:
      'Charade: COM (company) + PASS (pass) = COMPASS, the thing that shows the way. "Company" and "pass" are the building blocks.',
    device: "charade",
  },
];
