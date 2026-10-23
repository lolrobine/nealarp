import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import WordSquareStudio from "./page";
import { bankWords, SQUARES } from "./logic";

const LEVEL = SQUARES[0]!; // sap / ape / pea, decoys oat + tar

/** The word sitting in each row, read back out of the row labels. */
function board(): (string | null)[] {
  return screen.getAllByRole("button", { name: /^Row \d+:/ }).map((button) => {
    const label = button.getAttribute("aria-label") ?? "";
    if (label.includes(": empty.")) return null;
    return /^Row \d+: (\w+)\./.exec(label)?.[1] ?? null;
  });
}

function bank(): string[] {
  return within(screen.getByRole("group", { name: "Word bank" }))
    .getAllByRole("button")
    .map((button) => button.textContent ?? "");
}

/** Bank and board must always partition the level's words - no word lost, none duplicated. */
function expectCleanPartition() {
  const onScreen = [...bank(), ...board().filter((w): w is string => w !== null)].sort();
  expect(onScreen).toEqual([...bankWords(LEVEL)].sort());
}

function place(word: string, row: number) {
  fireEvent.click(screen.getByRole("button", { name: word }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Row ${row}:`) }));
}

describe("word-square-studio board", () => {
  it("moves a word between bank and board without ever cloning it", () => {
    render(<WordSquareStudio />);
    expectCleanPartition();
    place("sap", 1);
    expect(board()).toEqual(["sap", null, null]);
    expectCleanPartition();
    fireEvent.click(screen.getByRole("button", { name: /^Row 1: sap/ }));
    expect(board()).toEqual([null, null, null]);
    expectCleanPartition();
  });

  /** Regression: the hint only *selected* rows[0]. Placing a word that already sat in a row
   * filtered it out of a bank it was not in, leaving the same word in two rows at once. */
  it("hints the first word even when it is already parked in another row", () => {
    render(<WordSquareStudio />);
    place("sap", 3);
    place("oat", 1);
    fireEvent.click(screen.getByRole("button", { name: "Reveal first word" }));
    expect(board()).toEqual(["sap", null, null]);
    expect(bank()).toContain("oat");
    expectCleanPartition();
  });

  it("spells the per-row verdict out instead of relying on colour", () => {
    render(<WordSquareStudio />);
    place("sap", 1);
    place("oat", 2);
    place("tar", 3);
    fireEvent.click(screen.getByRole("button", { name: "Check square" }));

    expect(screen.getByText("1 of 3 rows match. Keep rearranging.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Row 1: sap\. Matches\./ }).textContent).toContain(
      "\u2713 match"
    );
    expect(
      screen.getByRole("button", { name: /^Row 2: oat\. Does not match yet\./ }).textContent
    ).toContain("\u2717 no match");
  });

  /** A verdict describes one arrangement. Once the board moves it is stale, and a green row
   * that no longer holds the word it was green for is worse than no feedback at all. */
  it("drops the verdict as soon as the board changes", () => {
    render(<WordSquareStudio />);
    place("sap", 1);
    place("oat", 2);
    place("tar", 3);
    fireEvent.click(screen.getByRole("button", { name: "Check square" }));
    expect(screen.queryByText(/rows match/)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^Row 2: oat/ }));
    expect(screen.queryByText(/rows match/)).toBeNull();
    expect(screen.queryByText(/match/)).toBeNull();
    expect(screen.getByRole("button", { name: /^Row 1: sap\. Activate/ })).toBeTruthy();
  });

  it("awards a clean hundred for a first-try square", () => {
    render(<WordSquareStudio />);
    LEVEL.rows.forEach((word, i) => place(word, i + 1));
    fireEvent.click(screen.getByRole("button", { name: "Check square" }));
    expect(screen.getByText("Square complete")).toBeTruthy();
    expect(screen.getByText("100 / 100")).toBeTruthy();
  });
});
