"use client";
import { useState, useSyncExternalStore } from "react";
import { useHydrated } from "@/lib/hooks/useHydrated";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export function validBirthday(year: string, month: string, day: string, today: string) {
  if (!year || !month || !day) return "";
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    iso <= today
    ? iso
    : "";
}
const subscribeYear = () => () => {};
const getYear = () => new Date().getFullYear();
const serverYear = () => 1900;
export function BirthdaySelect({ onChange }: { onChange: (value: string) => void }) {
  const hydrated = useHydrated();
  const [parts, setParts] = useState({ year: "", month: "", day: "" });
  const currentYear = useSyncExternalStore(subscribeYear, getYear, serverYear);
  const days = parts.month
    ? new Date(Number(parts.year) || 2000, Number(parts.month), 0).getDate()
    : 31;
  function change(key: keyof typeof parts, value: string) {
    const next = { ...parts, [key]: value };
    if (
      next.day &&
      next.month &&
      Number(next.day) > new Date(Number(next.year) || 2000, Number(next.month), 0).getDate()
    )
      next.day = "";
    setParts(next);
    const now = new Date(),
      today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    onChange(validBirthday(next.year, next.month, next.day, today));
  }
  return (
    <fieldset className="flex-1 min-w-0" disabled={!hydrated}>
      <legend className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
        When were you born?
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["day", "Day"],
            ["month", "Month"],
            ["year", "Year"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="min-w-0 text-xs text-[var(--muted-foreground)]">
            {label}
            <select
              aria-label={`Birth ${key}`}
              className="mt-1 w-full min-w-0 rounded-lg border bg-[var(--secondary)] px-2 py-3 text-sm text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
              value={parts[key]}
              onChange={(e) => change(key, e.target.value)}
            >
              <option value="">{label}</option>
              {Array.from(
                { length: key === "day" ? days : key === "month" ? 12 : currentYear - 1899 },
                (_, i) => {
                  const value = key === "year" ? currentYear - i : i + 1;
                  return (
                    <option key={value} value={String(value)}>
                      {key === "month" ? MONTHS[i] : value}
                    </option>
                  );
                }
              )}
            </select>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Choose a valid date on or before today. Your birthday stays in this browser.
      </p>
    </fieldset>
  );
}
