import { seededRandom } from "@/lib/games/daily";

/** Read the rule, then crash the one gate it describes. The rule is previewed for a
 * few seconds (practice mode keeps it visible). Every round is generated from a seed,
 * so the same day plays the same gate line-up for everyone. */

export type GateColor = "amber" | "teal" | "violet";
export type GateShape = "circle" | "square" | "triangle";
export type Gate = { color: GateColor; shape: GateShape; number: number };
export type Rule = {
  id: string;
  text: string;
  matches: (gate: Gate) => boolean;
};

export const COLORS: GateColor[] = ["amber", "teal", "violet"];
export const SHAPES: GateShape[] = ["circle", "square", "triangle"];

export const RULES: Rule[] = [
  { id: "highest", text: "Crash the highest number", matches: (g) => g.number === 6 },
  { id: "lowest", text: "Crash the lowest number", matches: (g) => g.number === 1 },
  { id: "even", text: "Crash the even number", matches: (g) => g.number % 2 === 0 },
  { id: "odd", text: "Crash the odd number", matches: (g) => g.number % 2 === 1 },
  { id: "circle", text: "Crash the circle", matches: (g) => g.shape === "circle" },
  { id: "square", text: "Crash the square", matches: (g) => g.shape === "square" },
  { id: "triangle", text: "Crash the triangle", matches: (g) => g.shape === "triangle" },
  { id: "amber", text: "Crash the amber gate", matches: (g) => g.color === "amber" },
  { id: "teal", text: "Crash the teal gate", matches: (g) => g.color === "teal" },
  { id: "violet", text: "Crash the violet gate", matches: (g) => g.color === "violet" },
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
    const gates: Gate[] = [0, 1, 2].map((i) => ({
      color: COLORS[i % COLORS.length]!,
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
    const rule = candidates[Math.floor(random() * candidates.length)]!;
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
