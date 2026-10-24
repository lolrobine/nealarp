import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import LaneGeneralPage from "./page";
import { enemyLineup, resolveFight, scoreStreak, UNITS, type Lineup } from "./logic";

const NOW = 1_700_000_000_000;
const SEED = `lane-general:${NOW}`;
const unit = (id: string) => UNITS.find((u) => u.id === id)!;

const draft = (id: string) =>
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${unit(id).name} ·`) }));

/** The lane strip, read top to bottom, as "Lane 1 Tuck" style strings. */
function lanes() {
  const list = screen.queryByRole("list", { name: "Lane order" });
  const items = list ? within(list).getAllByRole("listitem") : [];
  return items.map((li) => li.textContent?.replace(/\s+/g, " ").trim() ?? "");
}

const laneNames = () => lanes().map((text) => /^Lane \d+\s*([A-Za-z]+)/.exec(text)?.[1] ?? "");

const moveBack = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name: `Move ${name} one lane back` }));

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(NOW);
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("the draft", () => {
  it("shows the lane each pick landed in", () => {
    render(<LaneGeneralPage />);
    draft("tuck");
    draft("moss");
    draft("cheep");
    expect(laneNames()).toEqual(["Tuck", "Moss", "Cheep"]);
    expect(screen.getByRole("button", { name: /^Moss · Atk 1 · HP 6 · Lane 2/ })).toBeTruthy();
  });

  it("refuses a fourth unit but lets a pick be taken back", () => {
    render(<LaneGeneralPage />);
    draft("tuck");
    draft("moss");
    draft("cheep");
    expect((screen.getByRole("button", { name: /^Pip ·/ }) as HTMLButtonElement).disabled).toBe(
      true
    );

    draft("moss");
    expect(laneNames()).toEqual(["Tuck", "Cheep"]);
    expect((screen.getByRole("button", { name: /^Pip ·/ }) as HTMLButtonElement).disabled).toBe(
      false
    );
  });
});

describe("lane order", () => {
  it("lets the player reorder the lanes How to beat it tells them to reorder", () => {
    render(<LaneGeneralPage />);
    draft("tuck");
    draft("moss");
    draft("cheep");

    // Tuck + Moss + Cheep → Tuck + Cheep + Moss, the counter-beating order.
    moveBack("Moss");
    expect(laneNames()).toEqual(["Tuck", "Cheep", "Moss"]);
  });

  it("cannot push the front unit further forward or the last one further back", () => {
    render(<LaneGeneralPage />);
    draft("tuck");
    draft("moss");

    const front = screen.getByRole("button", {
      name: "Move Tuck one lane forward",
    }) as HTMLButtonElement;
    const back = screen.getByRole("button", {
      name: "Move Moss one lane back",
    }) as HTMLButtonElement;
    expect(front.disabled).toBe(true);
    expect(back.disabled).toBe(true);
  });

  it("locks the order once the fight has been resolved", () => {
    render(<LaneGeneralPage />);
    draft("tuck");
    draft("moss");
    draft("cheep");
    fireEvent.click(screen.getByRole("button", { name: "Fight round 1" }));

    expect(
      (screen.getByRole("button", { name: "Move Tuck one lane back" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });
});

describe("a round", () => {
  it("resolves exactly as the pure resolver does for that seed", () => {
    render(<LaneGeneralPage />);
    draft("tuck");
    draft("moss");
    draft("cheep");
    fireEvent.click(screen.getByRole("button", { name: "Fight round 1" }));

    const expected = resolveFight(
      [unit("tuck"), unit("moss"), unit("cheep")] as Lineup,
      enemyLineup(SEED, 0)
    );
    const verdict =
      expected.winner === "player" ? "Victory!" : expected.winner === "enemy" ? "Defeat." : "Draw.";
    expect(screen.getByText(verdict)).toBeTruthy();
    const log = screen.getByRole("list", { name: "Fight log" });
    expect(within(log).getAllByRole("listitem")).toHaveLength(expected.steps.length);
  });

  it("counts rounds won rather than calling them a streak", () => {
    render(<LaneGeneralPage />);
    expect(screen.getByText(/Rounds won 0 of 5/)).toBeTruthy();
  });
});

describe("the campaign", () => {
  function playFiveRounds() {
    for (let round = 0; round < 5; round += 1) {
      draft("tuck");
      draft("moss");
      draft("cheep");
      fireEvent.click(screen.getByRole("button", { name: `Fight round ${round + 1}` }));
      fireEvent.click(screen.getByRole("button", { name: /Next round|See final score/ }));
    }
  }

  it("ends on a score that matches the rounds won", () => {
    render(<LaneGeneralPage />);
    playFiveRounds();

    const won = Number(/Rounds won: (\d+) of 5/.exec(document.body.textContent ?? "")?.[1]);
    expect(Number.isNaN(won)).toBe(false);
    expect(localStorage.getItem("nealarp:best:v1:lane-general")).toBe(String(scoreStreak(won, 5)));
  });

  it("offers a new campaign instead of asking for a page reload", () => {
    render(<LaneGeneralPage />);
    playFiveRounds();

    fireEvent.click(screen.getByRole("button", { name: "New campaign" }));
    expect(screen.getByText(/Round 1 of 5 · Rounds won 0 of 5/)).toBeTruthy();
    expect(screen.queryByText("Campaign over")).toBeNull();
  });
});
