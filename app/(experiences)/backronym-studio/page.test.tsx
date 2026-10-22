import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import BackronymStudio from "./page";
import { coverageTrail, dailyLetters } from "./logic";

const slots = () => screen.getByRole("list", { name: /^Hidden word/ });

describe("backronym-studio board", () => {
  it("shows one slot per hidden letter", () => {
    render(<BackronymStudio />);
    expect(within(slots()).getAllByRole("listitem").length).toBe(dailyLetters().length);
  });

  it("starts with the first slot waiting and the rest empty", () => {
    render(<BackronymStudio />);
    const items = within(slots()).getAllByRole("listitem");
    expect(items[0]!.textContent).toContain("write this word next");
    expect(items[1]!.textContent).toContain("empty");
  });

  it("writes the claiming word into its slot as you type", () => {
    render(<BackronymStudio />);
    const letters = dailyLetters();
    const word = `${letters[0]}oddle`;
    fireEvent.change(screen.getByLabelText("Your phrase"), { target: { value: word } });
    const items = within(slots()).getAllByRole("listitem");
    expect(items[0]!.textContent).toContain(word);
    expect(items[1]!.textContent).toContain("write this word next");
  });

  it("keeps the running coverage count honest", () => {
    render(<BackronymStudio />);
    const letters = dailyLetters();
    fireEvent.change(screen.getByLabelText("Your phrase"), {
      target: { value: `${letters[0]}aaaa ${letters[1]}bbbb` },
    });
    expect(screen.getByText(`Covered 2 / ${letters.length} letters in order`)).toBeTruthy();
  });
});

describe("coverageTrail", () => {
  it("names the word that claimed each letter", () => {
    expect(coverageTrail(["silent", "poets", "always"], "spark")).toEqual([
      "silent",
      "poets",
      "always",
      null,
      null,
    ]);
  });

  it("skips words that do not start with the letter still wanted", () => {
    expect(coverageTrail(["silent", "zebra", "poets"], "sp")).toEqual(["silent", "poets"]);
  });

  it("matches the count that coverage() reports", () => {
    const trail = coverageTrail(["silent", "poets", "always", "rhyme", "kindly"], "spark");
    expect(trail.filter(Boolean).length).toBe(5);
  });
});
