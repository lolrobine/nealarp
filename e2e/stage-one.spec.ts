import { test, expect } from "@playwright/test";
import { unlockSite } from "./auth";

test.beforeEach(async ({ page }) => {
  await unlockSite(page);
});

test("timer completes a solo session, persists and resets its record", async ({ page }) => {
  await page.goto("/one-second-off");
  await page.clock.install();
  for (const seconds of [3, 7, 10]) {
    await page.getByRole("button", { name: "Start timer", exact: true }).click();
    await page.clock.runFor(1100);
    await expect(page.getByText("?.???", { exact: true })).toBeVisible();
    await page.clock.runFor(seconds * 1000 - 1100);
    await page.getByRole("button", { name: "Stop timer", exact: true }).click();
    if (seconds !== 10) await page.getByRole("button", { name: "Next round" }).click();
  }
  await expect(page.getByText(/Final score:/)).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("nealarp:best:v1:one-second-off:session"))
  ).not.toBeNull();
  await page.reload();
  await expect(page.getByText("No completed attempt in this mode yet.")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset best for this mode" }).click();
  await expect(page.getByText("No completed attempt in this mode yet.")).toBeVisible();
});

test("hidden tab cancels a timer without recording a score", async ({ page }) => {
  await page.goto("/one-second-off");
  await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByText(/Round cancelled:/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Start timer", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("nealarp:best:v1:one-second-off:session"))
  ).toBeNull();
});

test("visual game completes with keyboard sliders on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/trust-your-eyes");
  for (let round = 0; round < 6; round++) {
    const slider = page.getByRole("slider").first();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: "Submit estimate" }).click();
    await expect(page.getByText(/Round score:/)).toBeVisible();
    if (round < 5) await page.getByRole("button", { name: "Next challenge" }).click();
  }
  await expect(page.getByText(/Final score:/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("No completed session yet.")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset personal best" }).click();
  await expect(page.getByText("No completed session yet.")).toBeVisible();
});
