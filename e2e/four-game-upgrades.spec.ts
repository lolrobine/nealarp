import { test, expect } from "@playwright/test";
import { unlockSite } from "./auth";
test.beforeEach(async ({ page }) => {
  await unlockSite(page);
});
test("timer pad reveals measured time after each round", async ({ page }) => {
  await page.goto("/one-second-off");
  await page.getByRole("button", { name: "Timer pad — start", exact: true }).click();
  await page.getByRole("button", { name: "Timer pad — stop", exact: true }).click();
  const pad = page.getByRole("button", { name: /Round result: [\d.]+ seconds/ });
  await expect(pad).toBeDisabled();
  const label = await pad.getAttribute("aria-label");
  const time = label!.match(/([\d.]+) seconds/)![1]!;
  await expect(pad).toContainText(time);
  await expect(page.getByRole("status").first()).toContainText(`Round 1: ${time} s`);
  await page.getByRole("button", { name: "Next round", exact: true }).click();
  await expect(page.getByRole("button", { name: "Timer pad — start", exact: true })).toContainText(
    "7.000"
  );
});
test("dragging a rabbit onto grass places it at that point and consumes exactly one action", async ({
  page,
}) => {
  await page.goto("/tiny-ecosystem");
  const source = page.getByRole("button", { name: "Drag rabbit into habitat", exact: true }),
    world = page.getByRole("region", { name: "Living habitat", exact: true });
  await world.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  const from = (await source.boundingBox())!,
    to = (await world.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width * 0.52, to.y + to.height * 0.7, { steps: 15 });
  await page.mouse.up();
  await expect(page.getByRole("meter", { name: "Herbivores", exact: true })).toHaveAttribute(
    "value",
    "10"
  );
  await expect(page.getByText(/Interventions left: 1/)).toBeVisible();
  await expect(page.getByText("Rabbit placed in your world.", { exact: true })).toBeVisible();
  await expect(world.locator('[data-species="rabbit"]')).toHaveCount(10);
  await expect(world.locator('[data-species="rabbit"]').last()).toHaveAttribute(
    "transform",
    /translate/
  );
  const body = world.locator('[data-species="rabbit"] > g').first();
  const before = await body.evaluate((el) => getComputedStyle(el).transform);
  await expect.poll(() => body.evaluate((el) => getComputedStyle(el).transform)).not.toBe(before);
  await page.getByLabel("Pause world movement", { exact: true }).check();
  expect(await body.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await body.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});
test("touch-sized habitat supports pointer dragging and rejects sky drops without charging", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tiny-ecosystem");
  const source = page.getByRole("button", { name: "Drag bush into habitat", exact: true }),
    world = page.getByRole("region", { name: "Living habitat", exact: true });
  await source.scrollIntoViewIfNeeded();
  const from = (await source.boundingBox())!,
    to = (await world.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width * 0.5, to.y + to.height * 0.15, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByText(/Interventions left: 2/)).toBeVisible();
  await expect(page.getByText(/Drop on dry grass/)).toBeVisible();
  await source.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Place selected in habitat", exact: true }).click();
  await expect(page.getByRole("meter", { name: "Plants", exact: true })).toHaveAttribute(
    "value",
    "70"
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("birthday dropdowns handle leap days and calculate on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/life-stats");
  await page.getByLabel("Birth year", { exact: true }).selectOption("2000");
  await page.getByLabel("Birth month", { exact: true }).selectOption("2");
  await page.getByLabel("Birth day", { exact: true }).selectOption("29");
  await page.getByLabel("Birth year", { exact: true }).selectOption("2001");
  await expect(page.getByLabel("Birth day", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Calculate", exact: true })).toBeDisabled();
  await page.getByLabel("Birth day", { exact: true }).selectOption("28");
  await page.getByRole("button", { name: "Calculate", exact: true }).click();
  await expect(page.getByText(/heartbeats/i).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("golf provides nine maps and a switchable combined-gravity field", async ({ page }) => {
  await page.goto("/gravity-golf");
  await expect(page.getByLabel("Level", { exact: true }).locator("option")).toHaveCount(9);
  await page.getByLabel("Level", { exact: true }).selectOption("8");
  await expect(page.getByRole("heading", { name: "The final arc", exact: true })).toBeVisible();
  const field = page.getByRole("checkbox", { name: /Show gravity field/ });
  await expect(field).toBeChecked();
  await field.uncheck();
  await expect(field).not.toBeChecked();
});

test("habitat accepts a real touch drag", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const page = await context.newPage();
    await unlockSite(page);
    await page.goto("/tiny-ecosystem");
    const source = page.getByRole("button", { name: "Drag fox into habitat", exact: true }),
      world = page.getByRole("region", { name: "Living habitat", exact: true });
    await world.scrollIntoViewIfNeeded();
    await source.scrollIntoViewIfNeeded();
    const from = (await source.boundingBox())!,
      to = (await world.boundingBox())!;
    const session = await context.newCDPSession(page);
    const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 },
      end = { x: to.x + to.width * 0.5, y: to.y + to.height * 0.7 };
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    for (let i = 1; i <= 12; i++)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: start.x + ((end.x - start.x) * i) / 12, y: start.y + ((end.y - start.y) * i) / 12 },
        ],
      });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByRole("meter", { name: "Predators", exact: true })).toHaveAttribute(
      "value",
      "3"
    );
    await expect(page.getByText("Fox placed in your world.", { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
