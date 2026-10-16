import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { unlockSite } from "./auth";
test.beforeEach(async ({ page }) => {
  await unlockSite(page);
});
test("daily quiz is personal and PNG result cards download without uploads", async ({ page }) => {
  await page.goto("/which-is-more");
  await page.getByRole("button", { name: "Play today's challenge", exact: true }).click();
  await expect(page.getByLabel("Category", { exact: true })).toBeDisabled();
  await expect(page.getByText(/Daily task ·/)).toBeVisible();
  await page.evaluate(() => {
    const day = new Date();
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    localStorage.setItem(`nealarp:best:v1:which-is-more:daily:${key}:v1`, "100");
  });
  await page.reload();
  await page.getByRole("button", { name: "Play today's challenge", exact: true }).click();
  await expect(page.getByLabel("Perfect unlocked", { exact: true })).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result card", exact: true }).click();
  const download = await downloaded;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe("nealarp-which-is-more-result.png");
  const path = await download.path();
  expect(path).not.toBeNull();
  const data = readFileSync(path!);
  expect(data.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(data.readUInt32BE(16)).toBe(1200);
  expect(data.readUInt32BE(20)).toBe(630);
  await page.getByRole("button", { name: "Standard quiz", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Download result card", exact: true })
  ).toBeDisabled();
});
test("development preview removes app-owned workers and caches, not unrelated caches", async ({
  page,
}) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    const cache = await caches.open("nealarp-stale-preview");
    await cache.put("/", new Response("stale"));
    await caches.open("another-app-cache");
  });
  await page.reload();
  // Cleanup deliberately reloads a controlled tab. A probe can straddle that navigation.
  await expect
    .poll(
      async () => {
        try {
          return await page.evaluate(async () => ({
            workers: (await navigator.serviceWorker.getRegistrations()).filter((r) =>
              r.active?.scriptURL.endsWith("/sw.js")
            ).length,
            stale: (await caches.keys()).some((key) => key.startsWith("nealarp-")),
            foreign: (await caches.keys()).includes("another-app-cache"),
            controlled: !!navigator.serviceWorker.controller,
          }));
        } catch (error) {
          if (error instanceof Error && error.message.includes("Execution context was destroyed"))
            return null;
          throw error;
        }
      },
      { timeout: 15000 }
    )
    .toEqual({ workers: 0, stale: false, foreign: true, controlled: false });
  await expect(page.getByRole("heading", { name: "Games and Stuff" })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator('img[alt$=" thumbnail"]')).toHaveCount(18);
});
