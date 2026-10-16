import { test, expect } from "@playwright/test";
import { unlockSite } from "./auth";
test.beforeEach(async ({ page }) => {
  await unlockSite(page);
});

test("all eighteen covers load without external images", async ({ page }) => {
  const images = page.locator('img[alt$=" thumbnail"]');
  await expect(images).toHaveCount(18);
  await images.evaluateAll((elements) =>
    elements.forEach((img) => ((img as HTMLImageElement).loading = "eager"))
  );
  await expect
    .poll(
      () =>
        images.evaluateAll((elements) =>
          elements.every(
            (img) =>
              (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0
          )
        ),
      { timeout: 15000 }
    )
    .toBe(true);
  const paths = await images.evaluateAll((elements) =>
    elements.map((img) => img.getAttribute("src"))
  );
  expect(new Set(paths).size).toBe(18);
  expect(paths.every((path) => /\/realistic\.webp$/.test(path ?? ""))).toBe(true);
});
test("golf supports drag aiming, pausing and reduced-motion playback", async ({ page }) => {
  await page.goto("/gravity-golf");
  const course = page.getByRole("img", { name: /Gravity golf course/ });
  await course.scrollIntoViewIfNeeded();
  const b = await course.boundingBox();
  expect(b).not.toBeNull();
  await page.mouse.move(b!.x + b!.width * 0.1, b!.y + b!.height * 0.78);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width * 0.7, b!.y + b!.height * 0.15, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByLabel(/Launch angle/)).not.toHaveValue("25");
  await page.getByRole("button", { name: "Launch ball", exact: true }).click();
  await page.getByRole("button", { name: "Pause flight", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Replay / resume flight", exact: true })
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Restart level", exact: true }).click();
  await page.getByRole("button", { name: "Launch ball", exact: true }).click();
  await expect(page.getByText("Flight replay · 100%")).toBeVisible();
});
test("packing previews fit and accepts a dragged piece", async ({ page }) => {
  await page.goto("/pack-it-perfectly");
  const cell = page.getByRole("button", { name: "Row 1, column 1, empty", exact: true });
  await cell.hover();
  await expect(page.getByText(/Placement preview: Fits here/)).toBeVisible();
  await page.getByRole("button", { name: "Piece A", exact: true }).dragTo(cell);
  await expect(
    page.getByRole("button", { name: "Row 1, column 1, piece A", exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Row 1, column 1, empty", exact: true })
  ).toBeVisible();
});
test("experiment timeline can be scrubbed and resumed", async ({ page }) => {
  await page.goto("/one-small-change");
  await page.getByRole("button", { name: "Run experiment", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Live comparison of two bouncing balls" })
  ).toBeVisible();
  await page.getByLabel(/Experiment timeline/).fill("2");
  await expect(page.getByRole("button", { name: "Play / resume", exact: true })).toBeVisible();
  await expect(page.getByLabel(/Experiment timeline/)).toHaveValue("2");
  await page.getByRole("button", { name: "Play / resume", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause playback", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show final state", exact: true }).click();
  await expect(page.getByLabel(/Experiment timeline/)).toHaveValue("8");
});
test("habitat species placement consumes actions and alters the population", async ({ page }) => {
  await page.goto("/tiny-ecosystem");
  await page.getByRole("button", { name: "Drag rabbit into habitat", exact: true }).click();
  await page.getByRole("button", { name: "Place selected in habitat", exact: true }).click();
  await expect(page.getByRole("meter", { name: "Herbivores", exact: true })).toHaveAttribute(
    "value",
    "10"
  );
  await expect(page.getByText(/Interventions left: 1/)).toBeVisible();
});
test("quiz keyboard controls and approval stamps are usable", async ({ page }) => {
  await page.goto("/which-is-more");
  await page.getByLabel("Comparison quiz", { exact: true }).focus();
  await page.keyboard.press("2");
  await expect(page.getByText("Correct!", { exact: true })).toBeVisible();
  await page.goto("/form-game");
  await page.getByRole("textbox").fill("Ada");
  await page.getByRole("button", { name: "Request approval", exact: true }).click();
  await page.getByRole("button", { name: "Review approval 1", exact: true }).click();
  await expect(page.getByText("Approval 1: Enter your first name", { exact: true })).toBeVisible();
});
