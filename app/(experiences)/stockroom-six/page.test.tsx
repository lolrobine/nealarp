import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import StockroomSix from "./page";
import { dayProfit, MAX_ORDER } from "./logic";

const openDay = () => fireEvent.click(screen.getByRole("button", { name: "Open the day" }));

describe("stockroom-six clarity", () => {
  it("plots what the current order pays at every demand", () => {
    render(<StockroomSix />);
    const chart = screen.getByRole("img", { name: /Ordering 8 units pays between/ });
    expect(chart.tagName.toLowerCase()).toBe("svg");
  });

  it("redraws the payoff when the order changes", () => {
    render(<StockroomSix />);
    fireEvent.change(screen.getByLabelText(/Order quantity/), { target: { value: "12" } });
    expect(screen.getByRole("img", { name: /Ordering 12 units pays/ })).toBeTruthy();
  });

  it("describes the peak honestly: ordering n peaks once demand reaches n", () => {
    render(<StockroomSix />);
    fireEvent.click(screen.getByRole("button", { name: "16" }));
    expect(screen.getByRole("img", { name: /peaking when demand reaches 16/ })).toBeTruthy();
  });

  it("agrees with dayProfit about the best case", () => {
    render(<StockroomSix />);
    const label = screen.getByRole("img", { name: /Ordering 8 units/ }).getAttribute("aria-label")!;
    const best = Math.max(
      ...Array.from({ length: MAX_ORDER + 1 }, (_, d) => dayProfit(8, d).profit)
    );
    expect(label).toContain(`and ${best} coins`);
  });

  it("breaks the day down instead of leaving it as a table row", () => {
    render(<StockroomSix />);
    openDay();
    expect(screen.getByText(/^Day 1: you ordered 8/)).toBeTruthy();
    expect(screen.getByText(/Day profit/)).toBeTruthy();
  });

  it("says plainly when customers were turned away", () => {
    render(<StockroomSix />);
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    openDay();
    expect(screen.getByText(/Turned away: \d+ customers/)).toBeTruthy();
  });

  it("marks demands already seen on the chart", () => {
    const { container } = render(<StockroomSix />);
    const before = container.querySelectorAll("svg line").length;
    openDay();
    expect(container.querySelectorAll("svg line").length).toBe(before + 1);
  });
});
