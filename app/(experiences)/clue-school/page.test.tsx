import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ClueSchoolPage from "./page";
import { CLUES } from "./data";
import { scoreClues } from "./logic";

const answerBox = () => screen.getByRole("textbox");

function answer(text: string) {
  fireEvent.change(answerBox(), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Check" }));
}

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("solving a clue", () => {
  it("accepts the answer however it is typed", () => {
    render(<ClueSchoolPage />);
    answer(CLUES[0]!.answer.toLowerCase());
    expect(screen.getByText(CLUES[0]!.answer)).toBeTruthy();
    expect(localStorage.getItem("nealarp:best:v1:clue-school")).toBe("100");
  });

  it("counts wrong attempts and charges them to the score", () => {
    render(<ClueSchoolPage />);
    answer("definitely not it");
    expect(screen.getByText(/1 wrong attempt — /)).toBeTruthy();
    answer("still not it");
    expect(screen.getByText(/2 wrong attempts — /)).toBeTruthy();

    answer(CLUES[0]!.answer);
    expect(localStorage.getItem("nealarp:best:v1:clue-school")).toBe(String(scoreClues(2, 0)));
  });

  it("will not check an empty box", () => {
    render(<ClueSchoolPage />);
    expect((screen.getByRole("button", { name: "Check" }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });
});

describe("hints", () => {
  it("names the device first and the full walk-through second", () => {
    render(<ClueSchoolPage />);
    fireEvent.click(screen.getByRole("button", { name: "Hint 1/2" }));
    expect(screen.getByText(CLUES[0]!.device)).toBeTruthy();
    expect(screen.queryByText(CLUES[0]!.annotation)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Hint 2/2" }));
    expect(screen.getByText(CLUES[0]!.annotation)).toBeTruthy();
  });

  it("stops counting past the cap instead of offering a third of two", () => {
    render(<ClueSchoolPage />);
    fireEvent.click(screen.getByRole("button", { name: "Hint 1/2" }));
    fireEvent.click(screen.getByRole("button", { name: "Hint 2/2" }));

    expect(screen.queryByRole("button", { name: "Hint 3/2" })).toBeNull();
    const spent = screen.getByRole("button", { name: "Hints used 2/2" }) as HTMLButtonElement;
    expect(spent.disabled).toBe(true);
  });

  it("charges the hints to the score", () => {
    render(<ClueSchoolPage />);
    fireEvent.click(screen.getByRole("button", { name: "Hint 1/2" }));
    answer(CLUES[0]!.answer);
    expect(localStorage.getItem("nealarp:best:v1:clue-school")).toBe(String(scoreClues(0, 1)));
  });
});

describe("the clue strip", () => {
  it("marks a solved clue so a second visit knows where it stopped", () => {
    render(<ClueSchoolPage />);
    expect(screen.getByRole("button", { name: "Clue 1" })).toBeTruthy();

    answer(CLUES[0]!.answer);
    fireEvent.click(screen.getByRole("button", { name: "Next clue" }));

    expect(screen.getByRole("button", { name: "Clue 1, solved" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clue 2" })).toBeTruthy();
  });

  it("gives each clue its own fresh attempt and hint count", () => {
    render(<ClueSchoolPage />);
    answer("wrong");
    expect(screen.getByText(/1 wrong attempt/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Clue 2" }));

    expect(screen.queryByText(/wrong attempt/)).toBeNull();
    expect(screen.getByRole("button", { name: "Hint 1/2" })).toBeTruthy();
  });
});
