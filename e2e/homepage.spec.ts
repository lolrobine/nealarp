import { test, expect } from "@playwright/test";
import { unlockSite } from "./auth";

test.beforeEach(async ({ page }) => {
  await unlockSite(page);
});

test("homepage loads and shows experiences", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nealarp" })).toBeVisible();
  // Check at least one experience card
  await expect(page.getByText(/Spend.*Trillion|Password Game|Deep Sea/i).first()).toBeVisible();
});

test("search filters experiences", async ({ page }) => {
  await page.goto("/");
  const search = page.getByPlaceholder(/search experiences/i);
  await expect(search).toBeVisible();
  await search.fill("password");
  await expect(page.getByRole("heading", { name: "The Password Game" })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Spend Money" })).toHaveCount(0);
});

test("category filter works", async ({ page }) => {
  await page.goto("/");
  const gameBtn = page.getByRole("button", { name: /games/i }).first();
  await expect(gameBtn).toBeVisible();
  await gameBtn.click();

  await expect(page.locator("article")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "The Password Game" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deep Sea" })).toHaveCount(0);
});
