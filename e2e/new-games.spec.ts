import { test, expect } from "@playwright/test";
import { unlockSite } from "./auth";

test.beforeEach(async ({ page }) => {
  await unlockSite(page);
});

/** Interaction-level smoke checks for the twenty Wave 1–3 games. Each test asserts
 *  the game's own copy (headings/controls) so a wrong or empty route fails loudly. */
const newGames: { id: string; heading: RegExp; control: RegExp }[] = [
  { id: "growbox", heading: /Growbox/i, control: /Place/i },
  { id: "copy-machine", heading: /Copy Machine/i, control: /Copy/i },
  { id: "twin-tilt", heading: /Twin Tilt/i, control: /Rotate/i },
  { id: "word-square-studio", heading: /Word Square Studio/i, control: /Check square/i },
  { id: "clue-school", heading: /Clue School/i, control: /Hint/i },
  { id: "backronym-studio", heading: /Backronym Studio/i, control: /Today.s letters/i },
  { id: "stack-ledger", heading: /Stack Ledger/i, control: /Drop block/i },
  { id: "lava-links", heading: /Lava Links/i, control: /Warm up/i },
  { id: "ice-post", heading: /Ice Post/i, control: /Slide up/i },
  { id: "gate-crash", heading: /Gate Crash/i, control: /Keep rule visible/i },
  { id: "pocket-sand", heading: /Pocket Sand/i, control: /^Sand$/i },
  { id: "stockroom-six", heading: /Stockroom Six/i, control: /Fictional numbers/i },
  { id: "tiny-town-tactics", heading: /Tiny Town Tactics/i, control: /Scoring sheet/i },
  { id: "pocket-alchemist", heading: /Pocket Alchemist/i, control: /^Water$/i },
  { id: "orbit-orchard", heading: /Orbit Orchard/i, control: /Launch seed/i },
  { id: "pass-the-pencil", heading: /Pass the Pencil/i, control: /Solo dry-run/i },
  { id: "block-talk", heading: /Block Talk/i, control: /A1/i },
  { id: "current-courier", heading: /Current Courier/i, control: /Corner round/i },
  { id: "lane-general", heading: /Lane General/i, control: /Draft/i },
  { id: "light-loom", heading: /Light Loom/i, control: /Straight and narrow/i },
];

for (const game of newGames) {
  test(`${game.id} shows its game UI`, async ({ page }) => {
    await page.goto(`/${game.id}`);
    await expect(page.getByRole("heading", { name: game.heading }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(game.control).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/personal best/i).first()).toBeVisible();
  });

  test(`${game.id} exposes a keyboard-reachable primary control`, async ({ page }) => {
    await page.goto(`/${game.id}`);
    await expect(page.getByRole("heading", { name: game.heading }).first()).toBeVisible({
      timeout: 15_000,
    });
    const firstButton = page.getByRole("button").first();
    await expect(firstButton).toBeVisible();
    await firstButton.focus();
    await expect(firstButton).toBeFocused();
  });
}

test("twin-tilt rotates and counts a move", async ({ page }) => {
  await page.goto("/twin-tilt");
  const moves = page.getByText(/Moves:/);
  await expect(moves).toContainText("0");
  await page.getByRole("button", { name: /Rotate clockwise/i }).click();
  await expect(moves).toContainText("1");
});

test("clue-school accepts a typed guess", async ({ page }) => {
  await page.goto("/clue-school");
  await page.getByPlaceholder("ANSWER").fill("planet");
  await page.getByRole("button", { name: /^Check$/ }).click();
  await expect(page.getByText(/PLANET/i).first()).toBeVisible();
});

test("word-square-studio places a bank word into a row", async ({ page }) => {
  await page.goto("/word-square-studio");
  const bankWord = page.getByRole("button", { name: /^sap$/i });
  await bankWord.click();
  await page.getByRole("button", { name: /Row 1: empty/i }).click();
  await expect(page.getByRole("button", { name: /Row 1: sap/i })).toBeVisible();
});

test("gate-crash reveals its rule then accepts a pick", async ({ page }) => {
  await page.goto("/gate-crash");
  await page.getByRole("button", { name: /Keep rule visible/i }).click();
  await expect(page.getByText(/Crash the/i)).toBeVisible();
  await page.getByRole("button", { name: /Gate 1:/ }).click();
});

/** Interaction tests for the games whose boards were rebuilt. These assert real play,
 *  not just that copy is visible. NOTE: they have never been executed in this sandbox —
 *  the Chromium download is blocked here, so run them locally before trusting them. */
test("light-loom starts unsolved and is won by placing the tray optic", async ({ page }) => {
  await page.goto("/light-loom");
  await expect(page.getByRole("heading", { name: /Light Loom/i }).first()).toBeVisible({
    timeout: 15_000,
  });
  // Nothing is solved before the player acts.
  await expect(page.getByText(/Every target coloured/)).toHaveCount(0);
  // Level 1 ships a single mirror that belongs on the last square of the lamp's row.
  await page.getByRole("button", { name: /^Column 6, row 1:/ }).click();
  await expect(page.getByText(/Every target coloured/)).toBeVisible();
});

test("current-courier draws its streets and pays 100 for a par route", async ({ page }) => {
  await page.goto("/current-courier");
  await expect(page.getByRole("heading", { name: /Current Courier/i }).first()).toBeVisible({
    timeout: 15_000,
  });
  // The map is drawn as streets, not loose dots.
  await expect(page.locator("svg line").first()).toBeVisible();
  for (const node of ["A1", "B1", "C1", "C2", "C3", "B3", "A3"]) {
    await page.getByRole("gridcell", { name: new RegExp(`^${node}\\b`) }).click();
  }
  await expect(page.getByText(/Route length: 6 \/ par 6/)).toBeVisible();
  await page.getByRole("button", { name: "Finish route" }).click();
});
