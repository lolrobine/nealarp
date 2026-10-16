# React warning cleanup — 2026-10-16

## Finding and implementation plan

All 13 original ESLint warnings came from `react-hooks/set-state-in-effect`: synchronous state writes during effects caused avoidable cascading renders. They were not 13 distinct runtime failures. The plan was to derive UI from existing data, subscribe to browser snapshots, update interaction state in handlers, and give transient animation components their own lifecycle. No lint suppression, arbitrary delayed state synchronization, application dependency, or storage migration was needed.

| Original location                  | Count | Implemented change                                                                                                                                                                                                         |
| ---------------------------------- | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Asteroid `CountryMap` / `WorldMap` |     2 | Derive bursts from impact records. A keyed `ImpactBurst` owns expiration and timer cleanup; timestamps prevent old impacts replaying when maps remount. Shake/vibration effects remain external animation synchronization. |
| Password game                      |     2 | Pure prefix-based rule visibility, with historical unlocks retained in the input handler. Completion drives the confetti component directly.                                                                               |
| Deep Sea                           |     1 | Hydration snapshot replaces the effect-set mount flag.                                                                                                                                                                     |
| Perfect Circle                     |     1 | Subscribe to validated storage snapshots using the existing progress-store implementation, extended to support legacy keys. Preserve best/history/ghost keys and in-memory fallback for unavailable storage.               |
| Homepage                           |     1 | Derive a bounded focus index from the requested index and filtered length; arrow handlers use the effective index. The scrolling effect only updates the DOM.                                                              |
| Confetti                           |     1 | Mount a burst only while active; lazy-initialize its random particles once. Its expiration timer is cleaned up; inactive bursts unmount and reduced motion suppresses them.                                                |
| Password gate                      |     2 | Browser theme/hydration snapshots replace mirrored state. Derive cooldown error text directly, avoiding a stale countdown message after expiration.                                                                        |
| ThemeToggle                        |     1 | Resolve the selected theme directly from preference plus the OS media-query snapshot.                                                                                                                                      |
| Media-query / reduced-motion hooks |     2 | `useSyncExternalStore`, query-specific subscriptions, deterministic server snapshots and listener cleanup.                                                                                                                 |

`react-hooks/set-state-in-effect` is now an **error**, rather than retaining the old warning baseline. `AGENTS.md` reflects the new zero-warning expectation.

## Verification

- ESLint with `--max-warnings=0`: **0 errors, 0 warnings**.
- TypeScript and formatting: passed.
- Unit/component suite: **102 tests across 23 files passed**.
- Full Chromium browser suite: **49 tests passed**.
- Production static build: passed.
- New regression coverage: OS/preference changes, query subscription cleanup, legacy storage and storage events, confetti/impact expiration and timer cleanup, monotonic password-rule progression, gate cooldown text, keyboard focus after filtering, and drawing into an existing Perfect Circle history.
- The theme reload regression waits for the actual gallery heading, not a fixed sleep, before checking the restored theme. The constrained browser environment needed the same 15-second gate/navigation readiness allowance already used in the route smoke tests.

## Separate pre-existing diagnostics

This cleanup concerns the 13 ESLint warnings. The production build still emits existing Next.js diagnostics about the middleware convention, deprecated Edge runtime, Edge Open Graph routes conflicting with static generation, and middleware being unavailable in a static export. Development can also emit Next/Image dimension notices for existing game icons. These are separate from `react-hooks/set-state-in-effect`; they were not suppressed or described as fixed by this change. The client-side password gate remains a convenience screen, not server-side security.
