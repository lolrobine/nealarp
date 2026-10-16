import { expect, type Page } from "@playwright/test";

export async function unlockSite(page: Page): Promise<void> {
  await page.goto("/");

  const passwordInput = page.getByLabel(/site password/i);
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(
    process.env.E2E_SITE_PASSWORD ?? process.env.NEXT_PUBLIC_SITE_PASSWORD ?? "nealarp"
  );
  await page.getByRole("button", { name: /unlock/i }).click();
  await expect(page.getByRole("heading", { name: "Games and Stuff" })).toBeVisible();
}
