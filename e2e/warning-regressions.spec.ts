import { test, expect } from "@playwright/test";
import { unlockSite } from "./auth";

test("theme follows OS changes until explicitly overridden and persists on reload", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await unlockSite(page);
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Switch to dark mode", exact: true })
  ).toBeVisible();
  await page.emulateMedia({ colorScheme: "dark" });
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Games and Stuff" })).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Switch to dark mode", exact: true })
  ).toBeVisible();
});
test("password cooldown text returns to a normal error when the countdown ends", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByLabel(/site password/i);
  await expect(input).toBeEnabled();
  for (let i = 0; i < 3; i++) {
    await input.fill("not-the-site-password");
    await page.getByRole("button", { name: /Unlock →/ }).click();
    await expect(input).toHaveValue("");
  }
  await expect(page.locator('p[role="alert"]')).toContainText("3 failed");
  await expect(input).toBeEnabled({ timeout: 5000 });
  await expect(page.locator('p[role="alert"]')).toHaveText(
    "That password is not right. Try again."
  );
});
test("keyboard selection remains in bounds after narrowing the gallery", async ({ page }) => {
  await unlockSite(page);
  await page.getByRole("heading", { name: "Games and Stuff" }).click();
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowDown");
  await page
    .getByRole("searchbox", { name: "Search experiences", exact: true })
    .fill("Color Memory");
  await expect(page.locator("article[data-idx]")).toHaveCount(1);
  await page.getByRole("heading", { name: "Games and Stuff" }).click();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/color-memory$/);
});
test("perfect circle preserves legacy bests and appends to existing history", async ({ page }) => {
  await unlockSite(page);
  await page.evaluate(() => {
    localStorage.setItem("perfect-circle-best", "100");
    localStorage.setItem("perfect-circle-history", "[81,82]");
    localStorage.setItem(
      "perfect-circle-best-circle",
      JSON.stringify({ centerX: 200, centerY: 200, radius: 100 })
    );
  });
  await page.goto("/perfect-circle");
  const canvas = page.getByLabel(/drawing canvas/i);
  await canvas.scrollIntoViewIfNeeded();
  const rect = (await canvas.boundingBox())!;
  const cx = rect.x + rect.width / 2,
    cy = rect.y + rect.height / 2;
  await page.mouse.move(cx + rect.width * 0.3, cy);
  await page.mouse.down();
  for (let i = 1; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    await page.mouse.move(
      cx + Math.cos(a) * rect.width * 0.3,
      cy + Math.sin(a) * rect.height * 0.24
    );
  }
  await page.mouse.up();
  await expect(page.getByText("🏆 Best: 100%", { exact: true })).toBeVisible();
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("perfect-circle-history")!)
  );
  expect(history).toHaveLength(3);
  expect(history.slice(1)).toEqual([81, 82]);
});
