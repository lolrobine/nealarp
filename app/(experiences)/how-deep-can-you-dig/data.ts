export const DIG_SITES = [
  {
    depth: 0,
    name: "Surface",
    text: "Your imaginary drill begins here. Real drilling cannot take you to the center of Earth.",
  },
  {
    depth: 1,
    name: "A crust sample",
    text: "A fictional rock sample from inside the crust. This stop is a narrative choice, not a universal boundary.",
  },
  {
    depth: 35,
    name: "Model crust boundary",
    text: "We use 35 km as an illustrative continental crust thickness. Actual crust thickness varies greatly with location.",
  },
  {
    depth: 1000,
    name: "Inside the mantle",
    text: "The mantle is mostly solid rock that can deform over geological time. This 1,000 km stop is illustrative.",
  },
  {
    depth: 2890,
    name: "Outer core begins",
    text: "In this rounded model, the mantle gives way to the liquid outer core at about 2,890 km.",
  },
  {
    depth: 4000,
    name: "Within the outer core",
    text: "The outer core is liquid. Our fictional probe continues; no real drill has reached this region.",
  },
  {
    depth: 5150,
    name: "Inner core begins",
    text: "The model changes to the solid inner core at about 5,150 km. Boundaries here are approximate.",
  },
  {
    depth: 6371,
    name: "Center of the model Earth",
    text: "You reached the center using a mean Earth radius of 6,371 km. Real Earth is not a perfect sphere.",
  },
] as const;
export type DigProgress = { unlocked: number; selected: number };
export const INITIAL_DIG: DigProgress = { unlocked: 0, selected: 0 };
export function isDigProgress(value: unknown): value is DigProgress {
  if (!value || typeof value !== "object" || !("unlocked" in value) || !("selected" in value))
    return false;
  return (
    typeof value.unlocked === "number" &&
    Number.isInteger(value.unlocked) &&
    value.unlocked >= 0 &&
    value.unlocked < DIG_SITES.length &&
    typeof value.selected === "number" &&
    Number.isInteger(value.selected) &&
    value.selected >= 0 &&
    value.selected <= value.unlocked
  );
}
