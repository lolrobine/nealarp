import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BirthdaySelect, validBirthday } from "./BirthdaySelect";
afterEach(cleanup);
it("validates leap days, rejects future dates and invalid calendar days", () => {
  expect(validBirthday("2000", "2", "29", "2026-10-16")).toBe("2000-02-29");
  expect(validBirthday("1900", "2", "29", "2026-10-16")).toBe("");
  expect(validBirthday("2026", "12", "1", "2026-10-16")).toBe("");
  expect(validBirthday("2026", "4", "31", "2026-10-16")).toBe("");
});
it("resets an impossible day when switching from a leap year", () => {
  const change = vi.fn();
  render(<BirthdaySelect onChange={change} />);
  for (const [key, value] of [
    ["year", "2000"],
    ["month", "2"],
    ["day", "29"],
  ])
    fireEvent.change(screen.getByLabelText(`Birth ${key}`), { target: { value } });
  expect(change).toHaveBeenLastCalledWith("2000-02-29");
  fireEvent.change(screen.getByLabelText("Birth year"), { target: { value: "2001" } });
  expect((screen.getByLabelText("Birth day") as HTMLSelectElement).value).toBe("");
  expect(change).toHaveBeenLastCalledWith("");
});
