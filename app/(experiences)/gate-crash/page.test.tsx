import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import GateCrashPage from "./page";
import { correctGateIndex, generateRound } from "./logic";

const FIXED_NOW = 1_700_000_000_000;
const SEED = `gate-${FIXED_NOW}`;

/** The page seeds itself from the clock, so pin the clock to know the answers. */
function roundAt(index: number) {
  const round = generateRound(SEED, index);
  return { round, correct: correctGateIndex(round) };
}

function gateButton(index: number) {
  return screen.getByRole("button", { name: new RegExp(`^Gate ${index + 1}:`) });
}

/** Skip the preview countdown by keeping the rule on screen, which the game
 * offers as its practice mode. */
function startInPracticeMode() {
  render(<GateCrashPage />);
  fireEvent.click(screen.getByRole("button", { name: "Keep rule visible" }));
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("crashing gates", () => {
  it("counts a correct crash and moves on", () => {
    const { correct } = roundAt(0);
    startInPracticeMode();
    expect(screen.getByText(/Round 1 · Streak 0/)).toBeTruthy();

    fireEvent.click(gateButton(correct));

    expect(screen.getByText(/Round 2 · Streak 1/)).toBeTruthy();
    expect(screen.getByText(/^Correct —/)).toBeTruthy();
  });

  it("ends the run on a wrong crash and says which gate matched", () => {
    const { round, correct } = roundAt(0);
    startInPracticeMode();

    fireEvent.click(gateButton((correct + 1) % 3));

    const wanted = round.gates[correct]!;
    expect(screen.getByText(new RegExp(`Not quite.*${wanted.color} ${wanted.shape}`))).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play again" })).toBeTruthy();
  });

  it("records a perfect run without making the player lose on purpose", () => {
    // The run only ever ends on a mistake, so banking the score at the end of
    // the run meant a player who reached ten and stopped recorded nothing.
    startInPracticeMode();
    for (let i = 0; i < 10; i++) {
      fireEvent.click(gateButton(roundAt(i).correct));
    }
    expect(screen.getByText(/Streak 10/)).toBeTruthy();
    expect(localStorage.getItem("nealarp:best:v1:gate-crash")).toBe("100");
  });

  it("builds the score up round by round", () => {
    startInPracticeMode();
    fireEvent.click(gateButton(roundAt(0).correct));
    expect(localStorage.getItem("nealarp:best:v1:gate-crash")).toBe("10");
    fireEvent.click(gateButton(roundAt(1).correct));
    expect(localStorage.getItem("nealarp:best:v1:gate-crash")).toBe("20");
  });

  it("starts a fresh run from the play again button", () => {
    const { correct } = roundAt(0);
    startInPracticeMode();
    fireEvent.click(gateButton(correct));
    fireEvent.click(gateButton((roundAt(1).correct + 1) % 3));
    fireEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(screen.getByText(/Round 1 · Streak 0/)).toBeTruthy();
  });
});

describe("the preview phase", () => {
  it("will not let a gate be crashed while the rule is still being previewed", () => {
    vi.useFakeTimers();
    try {
      render(<GateCrashPage />);
      expect((gateButton(0) as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByText(/Previewing for 3s/)).toBeTruthy();

      act(() => void vi.advanceTimersByTime(3000));

      expect((gateButton(0) as HTMLButtonElement).disabled).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("hides the rule once the preview is over", () => {
    vi.useFakeTimers();
    try {
      render(<GateCrashPage />);
      expect(screen.getByText(roundAt(0).round.rule.text)).toBeTruthy();

      act(() => void vi.advanceTimersByTime(3000));

      expect(screen.queryByText(roundAt(0).round.rule.text)).toBeNull();
      expect(screen.getByText("Rule hidden")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
