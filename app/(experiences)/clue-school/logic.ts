import type { ClueLevel } from "./data";

export function normalizeGuess(guess: string): string {
  return guess
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function isCorrect(level: ClueLevel, guess: string): boolean {
  return normalizeGuess(guess) === normalizeGuess(level.answer);
}

export function scoreClues(wrongAttempts: number, hintsUsed: number): number {
  return Math.max(0, Math.min(100, 100 - 8 * wrongAttempts - 12 * hintsUsed));
}
