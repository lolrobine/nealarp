import { seededRandom } from "@/lib/games/daily";

/** Read the rule, then crash the one gate it describes. The rule is previewed for a
 * few seconds (practice mode keeps it visible). Rounds are generated from a seed the
 * page picks per session, so every visit brings a fresh line-up and the same seed
 * always replays the same rounds. This is not a shared daily puzzle. */

export type GateColor = "amber" | "teal" | "violet";
export type GateShape = "circle" | "square" | "triangle";
export type Gate = { color: GateColor; shape: GateShape; number: number };
/** Which property a rule talks about. Rounds are drawn family by family so the
 * three kinds stay roughly level; colours are distinct in every round and so
 * would otherwise be a valid rule every single time, which made them close to
 * half of all rounds. */
export type RuleFamily = "number" | "shape" | "color";
export type Rule = {
  id: string;
  family: RuleFamily;
  text: string;
  matches: (gate: Gate) => boolean;
};
export const FAMILIES: RuleFamily[] = ["number", "shape", "color"];

export const COLORS: GateColor[] = ["amber", "teal", "violet"];
export const SHAPES: GateShape[] = ["circle", "square", "triangle"];

export const RULES: Rule[] = [
  {
    id: "highest",
    family: "number",
    text: "Crash the highest number",
    matches: (g) => g.number === 6,
  },
  {
    id: "lowest",
    family: "number",
    text: "Crash the lowest number",
    matches: (g) => g.number === 1,
  },
  {
    id: "even",
    family: "number",
    text: "Crash the even number",
    matches: (g) => g.number % 2 === 0,
  },
  { id: "odd", family: "number", text: "Crash the odd number", matches: (g) => g.number % 2 === 1 },
  { id: "circle", family: "shape", text: "Crash the circle", matches: (g) => g.shape === "circle" },
  { id: "square", family: "shape", text: "Crash the square", matches: (g) => g.shape === "square" },
  {
    id: "triangle",
    family: "shape",
    text: "Crash the triangle",
    matches: (g) => g.shape === "triangle",
  },
  {
    id: "amber",
    family: "color",
    text: "Crash the amber gate",
    matches: (g) => g.color === "amber",
  },
  { id: "teal", family: "color", text: "Crash the teal gate", matches: (g) => g.color === "teal" },
  {
    id: "violet",
    family: "color",
    text: "Crash the violet gate",
    matches: (g) => g.color === "violet",
  },
];

export type Round = { rule: Rule; gates: Gate[] };

/** Three gates that differ in colour, shape and number; the rule matches exactly one. */
export function generateRound(seed: string, round: number): Round {
  const random = seededRandom(`${seed}:round:${round}`);
  for (let attempt = 0; attempt < 200; attempt++) {
    const numbers = [
      1 + Math.floor(random() * 6),
      1 + Math.floor(random() * 6),
      1 + Math.floor(random() * 6),
    ];
    // Shuffle the palette. Handing colours out by position made the leftmost
    // gate amber in every single round, so "crash the teal gate" was really
    // "crash the middle one" and the gates never had to be looked at.
    const palette = [...COLORS];
    for (let i = palette.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [palette[i], palette[j]] = [palette[j]!, palette[i]!];
    }
    const gates: Gate[] = [0, 1, 2].map((i) => ({
      color: palette[i]!,
      shape: SHAPES[Math.floor(random() * SHAPES.length)]!,
      number: numbers[i]!,
    }));
    // Guarantee a single highest and a single lowest.
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);
    if (numbers.filter((n) => n === max).length !== 1) continue;
    if (numbers.filter((n) => n === min).length !== 1) continue;
    // Pick a rule whose predicate is satisfied by exactly one gate.
    const candidates = RULES.filter((rule) => gates.filter((g) => rule.matches(g)).length === 1);
    if (!candidates.length) continue;
    // Pick the kind of rule first, then one of its rules, so a round is as
    // likely to be about a number or a shape as about a colour.
    const families = FAMILIES.filter((f) => candidates.some((c) => c.family === f));
    const family = families[Math.floor(random() * families.length)]!;
    const withinFamily = candidates.filter((c) => c.family === family);
    const rule = withinFamily[Math.floor(random() * withinFamily.length)]!;
    return { rule, gates };
  }
  // Deterministic fallback: always solvable by shape.
  return {
    rule: RULES.find((r) => r.id === "circle")!,
    gates: [
      { color: "amber", shape: "circle", number: 2 },
      { color: "teal", shape: "square", number: 4 },
      { color: "violet", shape: "triangle", number: 6 },
    ],
  };
}

export function correctGateIndex(round: Round): number {
  return round.gates.findIndex((g) => round.rule.matches(g));
}

export function scoreStreak(streak: number): number {
  return Math.max(0, Math.min(100, streak * 10));
}
