import { test, expect } from "@playwright/test";
import { unlockSite } from "./auth";
import { QUESTIONS } from "../app/(experiences)/which-is-more/logic";
import { LEVELS } from "../app/(experiences)/pack-it-perfectly/logic";
import { GOLF_LEVELS, simulateFlight } from "../app/(experiences)/gravity-golf/logic";

test.beforeEach(async ({ page }) => {
  await unlockSite(page);
});
test("color memory completes a five-round solo session", async ({ page }) => {
  await page.goto("/color-memory");
  await page.clock.install();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Show color" }).click();
    await expect(page.getByLabel("Target color", { exact: true })).toBeVisible();
    await page.clock.runFor(3000);
    await expect(page.getByLabel("Neutral pause")).toBeVisible();
    await page.clock.runFor(1000);
    await page.getByLabel("Red", { exact: false }).fill("120");
    await page.getByRole("button", { name: "Submit color" }).click();
    if (i < 4) await page.getByRole("button", { name: "Next color" }).click();
  }
  await expect(page.getByText(/Final score:/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("No completed attempt yet.")).toHaveCount(0);
});
test("measurement quiz completes and explains each answer", async ({ page }) => {
  await page.goto("/which-is-more");
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i]!;
    await page.getByRole("button", { name: q.a > q.b ? q.left : q.right, exact: true }).click();
    await expect(page.getByText(q.explanation, { exact: true })).toBeVisible();
    if (i < 9) await page.getByRole("button", { name: "Next question" }).click();
  }
  await expect(page.getByText("Final score: 100.0 / 100")).toBeVisible();
});
test("form saves, restores and grants its final permit", async ({ page }) => {
  await page.goto("/form-game");
  const answers = [
    "Ada",
    "mint",
    "20+5",
    "Please let me apply for this permit.",
    "permit",
    "4",
    "A-42",
    "this form is not a sandwich",
    "TIMREP",
    "I authorize this authorization",
  ];
  for (let i = 0; i < answers.length; i++) {
    await page.getByRole("textbox").fill(answers[i]!);
    await page.getByRole("button", { name: "Request approval" }).click();
    if (i === 2) {
      await page.reload();
      await expect(page.getByText("3 / 10 approvals")).toBeVisible();
    }
  }
  await expect(page.getByRole("heading", { name: "Permit granted!" })).toBeVisible();
  await page.getByRole("button", { name: "Reset form and saved answers" }).click();
  await expect(page.getByText("0 / 10 approvals")).toBeVisible();
});
test("all suitcase levels can be solved on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pack-it-perfectly");
  for (let i = 0; i < LEVELS.length; i++) {
    await page.getByLabel("Level", { exact: true }).selectOption(String(i));
    for (const p of LEVELS[i]!.solution) {
      await page.getByRole("button", { name: new RegExp(`^Piece ${p.id}`) }).click();
      await page
        .getByRole("button", { name: `Row ${p.y + 1}, column ${p.x + 1}, empty`, exact: true })
        .click();
    }
    await expect(page.getByRole("status")).toContainText("Perfectly packed!");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});
test("all golf courses have a playable winning shot", async ({ page }) => {
  await page.goto("/gravity-golf");
  for (let i = 0; i < GOLF_LEVELS.length; i++) {
    let solution: { angle: number; power: number } | null = null;
    for (let a = 15; a <= 45 && !solution; a += 0.5)
      for (let p = 100; p <= 220; p += 5)
        if (simulateFlight(GOLF_LEVELS[i]!, a, p).outcome === "goal") {
          solution = { angle: a, power: p };
          break;
        }
    expect(solution).not.toBeNull();
    await page.getByLabel("Level", { exact: true }).selectOption(String(i));
    await page.getByLabel(/Launch angle/).fill(String(solution!.angle));
    await page.getByLabel(/Launch power/).fill(String(solution!.power));
    await page.getByRole("button", { name: "Launch ball" }).click();
    await expect(page.getByRole("status")).toContainText("Goal!");
  }
});
test("digging unlocks the complete journey and restores it", async ({ page }) => {
  await page.goto("/how-deep-can-you-dig");
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "Dig to next discovery" }).click();
  await expect(page.getByRole("status")).toContainText("Journey complete!");
  await page.reload();
  await expect(page.getByText("8 / 8 discoveries")).toBeVisible();
  await page.getByLabel("Jump to a discovered depth").selectOption("0");
  await expect(page.getByRole("heading", { name: "Surface", exact: true })).toBeVisible();
});
test("ecosystem can survive all twelve rounds", async ({ page }) => {
  await page.goto("/tiny-ecosystem");
  for (let i = 0; i < 12; i++) await page.getByRole("button", { name: "Advance round" }).click();
  await expect(page.getByRole("status")).toContainText("Twelve rounds of balance!");
  await page.getByRole("button", { name: "Restart ecosystem" }).click();
  await expect(page.getByText(/Round 0 \/ 12/)).toBeVisible();
});
test("one small change shows a reproducible comparison and resets", async ({ page }) => {
  await page.goto("/one-small-change");
  await page.getByLabel(/Restitution coefficient/).fill("0.9");
  await page.getByRole("button", { name: "Run experiment" }).click();
  await expect(page.getByRole("heading", { name: "Experiment complete" })).toBeVisible();
  await page.getByText("Read the height data", { exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(page.getByRole("heading", { name: "Experiment complete" })).toHaveCount(0);
});
