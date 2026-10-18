import { localDayKey, seededRandom } from "@/lib/games/daily";

/** Pass the Pencil is a drawing-telephone party game for one player with an AI-free
 * twist: the "other players" are prompt cards drawn from a seeded deck. Each round you
 * draw from a prompt, then the next round redraws from memory of the previous drawing.
 * Handoff privacy is respected: prompt text is hidden during the redrawing round
 * (inspired by Telestrations and Gartic Phone, with original prompts). */

export type Round = {
  index: number;
  prompt: string;
  /** True when the player draws from memory of their own previous drawing. */
  memoryRound: boolean;
};

export const PROMPTS: string[] = [
  "a sleepy dragon doing the dishes",
  "a lighthouse that is afraid of the dark",
  "two penguins running a bakery",
  "a robot learning to whistle",
  "a haunted wheelbarrow",
  "a cat mayor giving a speech",
  "a rocket-powered snail race",
  "a snowman on holiday at the beach",
  "a knight apologising to a dragon",
  "a fish flying a tiny kite",
  "a ghost struggling with a vending machine",
  "an octopus playing four guitars",
  "a very tall sandwich being measured",
  "a detective dog examining a chewed slipper",
  "a wizard watering plastic plants",
  "a moon family having a picnic",
];

export const ROUNDS = 6;

export function buildRun(seed: string): Round[] {
  const random = seededRandom(`${seed}:pass-the-pencil`);
  const prompts = [...PROMPTS];
  for (let i = prompts.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [prompts[i], prompts[j]] = [prompts[j]!, prompts[i]!];
  }
  return Array.from({ length: ROUNDS }, (_, index) => ({
    index,
    prompt: prompts[index % prompts.length]!,
    memoryRound: index > 0 && index % 2 === 1,
  }));
}

export type RoundScore = { index: number; match: number; effort: number };

/** The player self-rates recognition (how much of the original survived) 0–5 and
 * effort 0–5; the game computes the run score from those honest marks. */
export function scoreRound(match: number, effort: number): number {
  return Math.max(0, Math.min(100, match * 12 + effort * 8));
}

export function scoreRun(rounds: RoundScore[]): number {
  if (!rounds.length) return 0;
  return Math.round(rounds.reduce((s, r) => s + scoreRound(r.match, r.effort), 0) / rounds.length);
}

export function dailySeed(date = new Date()): string {
  return `pass-the-pencil:${localDayKey(date)}`;
}
