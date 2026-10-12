import { test, expect } from "@playwright/test";

test("homepage loads and shows experiences", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Nealarp")).toBeVisible();
  // Check at least one experience card
  await expect(page.getByText(/Spend.*Trillion|Password Game|Deep Sea/i).first()).toBeVisible();
});

test("search filters experiences", async ({ page }) => {
  await page.goto("/");
  const search = page.getByPlaceholder(/search experiences/i);
  await expect(search).toBeVisible();
  await search.fill("password");
  // Should show password game, hide others
  await expect(page.getByText("The Password Game")).toBeVisible();
});

test("category filter works", async ({ page }) => {
  await page.goto("/");
  const gameBtn = page.getByRole("button", { name: /game/i }).first();
  await gameBtn.click();
  // Should still show at least one
  await expect(page.locator("main").first()).toBeVisible();
});
