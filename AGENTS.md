# Instructions for coding agents

## Current sources of truth

- `package.json` and `pnpm-lock.yaml` define the toolchain. Use `corepack pnpm`; do not use npm or create another lockfile.
- The current app is a single Next.js App Router project. Routes live under `app/`; experiences live under `app/(experiences)/`.
- `content/experiences.json` is the experience catalogue. Keep each live experience's route id, metadata, and catalogue entry consistent.
- `README.md` and `CONTRIBUTING.md` describe the current project. Files under `docs/archive/` are historical snapshots, not active requirements or a current roadmap. Verify any old finding against the code before acting on it.

## Project constraints and conventions

- GitHub Pages is a static export. Keep changes compatible with that deployment; do not introduce server-only features or assume `middleware.ts` protects static content.
- The password screen is a client-side convenience gate, not security for private content. Do not describe it as server-side access control.
- Use `getAssetUrl()` for public assets that need the GitHub Pages base path.
- Project-specific agent skills live under `.agents/skills/`; consult only the skill relevant to the task. This root guide, the current code, tests, and deployment constraints take precedence over upstream skill guidance.
- Prefer the existing shared components in `lib/components/ui/`, utilities in `lib/utils/`, and established per-experience patterns over adding new abstractions.
- Respect keyboard access, visible focus, semantic labels, and `prefers-reduced-motion` for UI changes.
- New or changed factual claims (especially science, speed, prices, and impact calculations) need a source or a clearly stated assumption. Do not invent data or citations.
- Avoid unrelated refactors and new dependencies. If a dependency is genuinely needed, explain why and update `pnpm-lock.yaml` with `corepack pnpm`.
- Keep ESLint free of warnings and errors. `react-hooks/set-state-in-effect` is enforced as an error; use derived values, event updates, and external-store subscriptions rather than effect-driven state synchronization.

## Working workflow

1. Inspect the relevant route, shared components, data, and tests before editing.
2. For non-trivial work, state the intended behavior and a short plan; ask a focused question if requirements are ambiguous.
3. Make the smallest change that satisfies the acceptance criteria. Add or update a regression test for changed behavior.
4. Run the checks relevant to the change. Do not claim a check passed unless you ran it and saw a successful exit.
5. In the final response, summarize changed files, checks and outcomes, plus any remaining risks.

For tasks, prefer a brief that specifies: goal, current behavior or reproduction steps, expected behavior, acceptance criteria, non-goals, and required checks.

## Commands

Use the pinned package manager through Corepack:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
corepack pnpm test
corepack pnpm test:e2e
corepack pnpm build
```

The Playwright suite unlocks the local site with `E2E_SITE_PASSWORD` or the documented default password. Keep the E2E setup in sync if the gate changes.
