---
name: nealarp-ui-review
description: Review Nealarp interface changes for usability, accessibility, responsive behavior, and consistency with the existing experience catalogue. Use for UI reviews, visual changes, or accessibility checks.
---

# Nealarp UI review

Use the repository's root `AGENTS.md` as the source of truth. This is a focused review checklist, not permission to redesign unrelated screens or add dependencies.

## Review workflow

1. Inspect the affected route, shared UI components, styles, experience metadata, and any existing tests before suggesting changes.
2. Check the rendered behavior and source together. Report only findings supported by a concrete element, state, viewport, or code path.
3. Prefer the existing components and patterns. Keep changes compatible with the GitHub Pages static export and the project's base path.
4. Make actionable findings with file/line references and a severity. Do not present personal taste as a defect.

## Checklist

- **Semantics:** controls use the correct HTML element and have clear accessible names; headings and landmarks remain meaningful.
- **Keyboard:** every interactive element is reachable and usable without a pointer; focus is visible and not trapped or obscured.
- **Motion:** respect `prefers-reduced-motion`; avoid introducing animation that blocks interaction or makes state hard to perceive.
- **Responsive layout:** inspect narrow and wide layouts for clipped content, horizontal overflow, unreadable line lengths, and controls that become difficult to use.
- **States:** check loading, empty, selected, disabled, and error states where applicable; communicate state with more than color alone.
- **Assets and deployment:** use the existing asset helpers for public files and test paths with the GitHub Pages base path in mind.
- **Content:** factual statements need a source or a clearly stated assumption, especially for science, prices, speed, and impact calculations.

## Verification

Use the existing lint, typecheck, and Playwright suite when relevant. If a real browser check cannot run, state that limitation rather than treating static inspection as runtime verification.

For a full guideline audit, consult the upstream Vercel Web Interface Guidelines only when the source is reachable. Do not claim to have loaded the latest upstream rules if access fails.
