import { test, expect } from "@playwright/test";
import { unlockSite } from "./auth";

test.beforeEach(async ({ page }) => {
  await unlockSite(page);
});

const experiences = [
  "spend-money",
  "password-game",
  "deep-sea",
  "size-of-space",
  "speed",
  "life-stats",
  "asteroid-launcher",
  "perfect-circle",
  "one-second-off",
  "trust-your-eyes",
  "color-memory",
  "which-is-more",
  "form-game",
  "pack-it-perfectly",
  "gravity-golf",
  "how-deep-can-you-dig",
  "tiny-ecosystem",
  "one-small-change",

  "clue-school",
  "word-square-studio",
  "backronym-studio",
  "twin-tilt",
  "light-loom",
  "orbit-orchard",
  "growbox",
  "ice-post",
  "stack-ledger",
  "current-courier",
  "lava-links",
  "gate-crash",
  "tiny-town-tactics",
  "lane-general",
  "stockroom-six",
  "pass-the-pencil",
  "block-talk",
  "pocket-alchemist",
  "pocket-sand",
  "copy-machine",
];

for (const id of experiences) {
  test(`${id} loads`, async ({ page }) => {
    await page.goto(`/${id}`);
    // First visits compile routes in dev and then hydrate the client-side gate.
    // Wait for actual readiness rather than assuming every cold route finishes in 5 seconds.
    await expect(page.getByRole("link", { name: /back/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("main").first()).toBeVisible();
  });
}

test("spend-money can buy", async ({ page }) => {
  await page.goto("/spend-money");
  const buyBtn = page.getByRole("button", { name: /buy one/i }).first();
  await expect(buyBtn).toBeVisible();
  await buyBtn.click();
  // Should show remaining updated and receipt
  await expect(page.getByText(/receipt/i).first()).toBeVisible();
});

test("password-game input works", async ({ page }) => {
  await page.goto("/password-game");
  const input = page.getByLabel(/choose a password/i);
  await expect(input).toBeVisible();
  await input.fill("Test123!");
  await expect(page.getByText(/Rule 1/i)).toBeVisible();
});

test("life-stats calculates", async ({ page }) => {
  await page.goto("/life-stats");
  await page.getByLabel("Birth year", { exact: true }).selectOption("2000");
  await page.getByLabel("Birth month", { exact: true }).selectOption("1");
  await page.getByLabel("Birth day", { exact: true }).selectOption("1");
  await page.getByRole("button", { name: /calculate/i }).click();
  await expect(page.getByText(/heartbeats/i).first()).toBeVisible();
});

test("asteroid-launcher sliders", async ({ page }) => {
  await page.goto("/asteroid-launcher");
  const slider = page.getByLabel(/diameter/i).first();
  await expect(slider).toBeVisible();
  // Results panel heading: "Preview" before launching, "Impact #N"/"N impacts" after
  await expect(page.getByRole("heading", { name: /preview|impact/i })).toBeVisible();
});

test("perfect-circle canvas exists", async ({ page }) => {
  await page.goto("/perfect-circle");
  const canvas = page.getByLabel(/drawing canvas/i);
  await expect(canvas).toBeVisible();
});
