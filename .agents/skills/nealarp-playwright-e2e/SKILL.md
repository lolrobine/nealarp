---
name: nealarp-playwright-e2e
description: Add, review, or run end-to-end tests for Nealarp's Next.js UI using the project's Playwright Test setup. Use for interaction, navigation, filters, password-gate, and browser-regression work.
---

# Nealarp Playwright E2E

Use the existing Node.js Playwright Test suite. The upstream Anthropic web-app-testing example uses Python Playwright; do not introduce that separate stack here.

## Project setup

- Specs live in `e2e/`; follow the existing `*.spec.ts` conventions.
- `playwright.config.ts` starts the app with `corepack pnpm dev`.
- Use the helper in `e2e/auth.ts` for the client-side site-password gate. Do not hard-code credentials in individual tests.
- Prefer user-visible locators such as `getByRole`, `getByLabel`, and `getByText` over brittle implementation selectors.

## Workflow

1. Read the affected route and nearby specs. Identify the user-visible behavior that could regress.
2. Add the smallest test that proves the expected outcome, including a meaningful negative or empty-state assertion when relevant.
3. Run `corepack pnpm exec playwright test --list` to check discovery, then `corepack pnpm test:e2e` when Chromium is available.
4. Run relevant unit/type/lint checks as well; a passing E2E test does not replace them.
5. Report which checks actually ran. If the browser download or launch is blocked, mark E2E as unverified and give the blocker; do not count test discovery as a browser pass.

## Constraints

- Do not add Python Playwright helpers, browser dependencies, or another test runner for a one-off test.
- Do not install `agent-browser` as an application dependency. The repository uses Playwright Test; the optional agent-browser CLI has separate runtime requirements.
- Keep assertions independent of brittle timing. Wait for visible conditions instead of arbitrary sleeps where possible.
- Tests should not send real credentials or mutate production services.
