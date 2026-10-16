import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const devPort = new URL(baseURL).port || "3000";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // In CI, print results to the log ("list"), annotate the check run with
  // failures ("github"), and keep the HTML report for the uploaded artifact.
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    // Optional system browser for restricted/offline CI; normal Playwright installs stay unchanged.
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? {
          launchOptions: {
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
            args: [
              "--no-sandbox",
              "--disable-dev-shm-usage",
              "--use-gl=angle",
              "--use-angle=swiftshader",
            ],
          },
        }
      : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `corepack pnpm dev --hostname 0.0.0.0 --port ${devPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
