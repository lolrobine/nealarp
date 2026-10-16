# Singleplayer rollout

All five planned stages now have implemented, registered first releases. The ten additions bring the catalogue from eight to eighteen experiences. They run as client-side singleplayer experiences on the existing static deployment. No account, multiplayer, duel, leaderboard, or new application dependency was introduced.

## Delivered scope

| Stage | Experiences                                             | Shipped content                                                                                                                                              |
| ----- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | One Second Off; Trust Your Eyes                         | Hidden timer with single/session modes; six visual precision tasks; locally resettable scores                                                                |
| 2     | Color Memory; Which Is More?                            | Five color-recall rounds with the last ten session scores; ten measurement questions with two categories, saved quiz streaks and unlimited unscored practice |
| 3     | The Form Game                                           | Ten linked approvals, a tested complete solution, hints, automatic local progress restoration and a final permit                                             |
| 4     | Pack It Perfectly; Gravity Golf                         | Three solvable packing levels with undo and rotation; three reachable golf goals with fixed-step integration and partial previews                            |
| 5     | How Deep Can You Dig?; Tiny Ecosystem; One Small Change | Eight saved discoveries; twelve-turn ecosystem game; a complete single-parameter bouncing-ball experiment                                                    |

The UI remains English, consistent with the existing catalogue. None of the new experiences requires motion: physics replays can be paused, skipped or scrubbed, and reduced-motion mode displays the final state immediately. The only timed interaction is the intentionally timed memory/timer gameplay.

## Explicit first-release choices

- **Which Is More?** uses fictional speed scenarios and geometric area/volume comparisons. Every answer follows supplied numbers and simple arithmetic. Existing animal/vehicle data was not copied without validation. It is not a real-world records quiz.
- **Packing** uses selection plus grid-cell activation, with optional desktop dragging and fit previews. This supports touch and keyboard controls without a second puzzle implementation.
- **Golf** calculates the whole flight using 1/120-second steps, checks collisions at every step and renders a replayable path. The trajectory now has an optional animated ball replay with pause/replay/skip controls, independent of physics and scoring. Drag aiming supplements the sliders. Runs have eight attempts; all nine courses are independently selectable.
- **Digging** is a button-driven discovery journey with a compressed logarithmic depth strip and revisit navigation, rather than thousands of pixels of mandatory scrolling. It is an impossible fictional drill, not a drilling-feasibility simulator.
- **Ecosystem** uses arbitrary fractional population units and published-in-UI gameplay formulas. These are not empirical biology parameters.
- **One Small Change** intentionally ships one complete experiment, as planned. Reference and trial share every input except restitution. It has no arbitrary success score.
- A level editor, importable levels, global challenge systems, image exports and a separate achievements system are not part of these first-release stages. They remain optional follow-ups, not hidden incomplete modes. There are no multiplayer placeholders.

## Data and privacy

- Bests are local, versioned `nealarp:best:v1:<game/mode/level>` records.
- Color session history, form progress and digging discoveries use `nealarp:progress:v1:` JSON, validated before use. Broken or out-of-range data falls back to a fresh game.
- Storage failures do not prevent finishing a session; the interface warns that persistence is unavailable. A failed write after a successful earlier save continues with in-memory progress, rather than reverting the UI.
- Form answers are approved-step progress, not keystroke telemetry. Players are asked to use fictional names and avoid sensitive information.
- Reset buttons delete the corresponding records. No data is sent to an API.

## Science and scoring

Each scored experience explains its own formula. Color Memory uses normalized Euclidean RGB distance, explicitly **not** a perceptually uniform or clinical vision metric. The timer is **not** a scientific reaction/performance test.

Earth layer descriptions reference [USGS: Inside the Earth](https://pubs.usgs.gov/gip/dynamic/inside.html); the mean radius references the [NASA Earth Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html). Boundaries are rounded, crust thickness varies, and narrative stops are labeled. Gravity and bouncing use simplified models, explicitly stated in their UIs.

## Verification

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
corepack pnpm test
corepack pnpm exec playwright test --list
corepack pnpm test:e2e
corepack pnpm build
```

Logic tests prove a full solution for every form step and packing level, search for reachable shots on every golf course, test deterministic physics and compare valid/invalid saved progress. Component tests play complete sessions, cover reset/reload behavior and simulate storage write failures. Browser tests cover all catalogue routes, every new game's completion flow, all packing/golf levels, mobile packing, keyboard sliders and local restoration.

Normally install the Playwright-managed Chromium with `corepack pnpm exec playwright install chromium`. Restricted environments can optionally set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing compatible Chromium executable; this does not change the default setup or install a browser dependency into the application. System library/font setup for a custom executable is the environment's responsibility. A custom headless runtime may need `--workers=1`.

The development server allows the embedded preview; production retains its frame-denial header. Public SVGs are local and pass through the existing base-path helpers. The service-worker cache version was incremented for the expanded catalogue. Development no longer registers a service worker, because caching mutable dev/HMR chunks caused reload hydration stalls during browser verification.

### Verified results (2026-10-16)

- `typecheck` and `format:check`: passed.
- Vitest: **102 tests passed** across 23 files.
- Playwright: **49 browser tests passed**, including the original experiences and all ten additions. Run with a standalone Chromium 153 executable and one worker in this restricted environment.
- Production static export: passed; all eighteen experience routes are generated. Existing middleware/Edge/Open Graph export warnings remain outside this rollout.
- ESLint: **zero errors and zero warnings** after the React effect-state cleanup; `eslint . --max-warnings=0` passes. The rule is now enforced as an error. See [cleanup notes](react-warning-cleanup.md).

The cold-route smoke test now waits up to fifteen seconds for the actual navigation control to become available. It does not use a fixed sleep. This covers development compilation and the existing client-side unlock gate on constrained machines.

### Interaction and illustration update

Every catalogue entry now has a distinct local 16:9 photorealistic generated cover and a matching SVG icon. All eighteen active thumbnails are WebP; vector fallbacks are retained. `scripts/build-thumbnails.mjs` regenerates vector artwork without replacing photographic cover registrations. The browser suite checks that all eighteen covers actually decode, rather than merely checking paths. SVG parsing is also covered by unit tests.

The new interaction coverage exercises drag aiming and pause/reduced-motion playback, actual packing drag-and-drop plus undo, timeline scrubbing, habitat brushes, quiz number keys and approval-stamp review. The direct color mixer and timer pad have component regression tests. Animation is a presentation layer: no score or physics formula depends on frame timing.

### Photorealistic cover batch

All eighteen AI-generated realistic covers are complete, including the final eight: Color Memory, Which Is More?, The Form Game, Pack It Perfectly, Gravity Golf, How Deep Can You Dig?, Tiny Ecosystem and One Small Change. They are creative promotional artwork, not real documentary/scientific imagery. Original JPEG masters are retained; pages load locally optimized WebP files (960 × 540, about 25–152 KB each). No image-generation batch remains pending.

`node scripts/optimize-realistic-thumbnails.mjs` uses the image processor already installed by Next, so no dependency was added. Regenerating SVG fallbacks preserves `realistic.webp` registrations. Unit tests now require all eighteen realistic registrations, valid WebP headers and bounded sizes; SVG fallbacks are also parsed. The browser suite loads and decodes all eighteen actual WebP images.

### Cache freshness and personal extras

The old cache-first HTML policy could keep a previous catalogue in a returning browser even when the files were updated. Production now uses network-first HTML/artwork with cached offline fallback; only immutable Next chunks are cache-first. Development unregisters only this app's old root/subpath workers, removes only `nealarp-` caches and reloads a controlled page once. The live preview moved from port 3000 to a fresh origin on port 3001 to bypass stale documents that cannot execute the new cleanup code. Browser regression coverage installs a worker and stale cache, then verifies cleanup and preservation of another app's cache. Worker policy tests cover fresh HTML, offline fallback, artwork refresh, immutable assets, RSC exclusions and scoped cache deletion.

Optional daily modes for Color Memory and Which Is More? use local-calendar date seeds and separate versioned daily record keys. The day is fixed when selecting the mode, including across midnight; restarting keeps the same challenge. Color tasks generate five bounded RGB colors; quiz tasks shuffle existing fictional measurements and swap sides while preserving their explanations. Daily play never overwrites standard records/history. No account, shared ranking or attendance streak was added.

All seven normalized-score additions now offer derived local achievements (First Finish, 60/80/95/100 points) and 1200 × 630 PNG best-result downloads. Achievements are per saved mode/level and reset with that best. The PNG has only game/mode/date and score; it never includes form data and is generated locally with Canvas, without uploads or a new dependency. Scoreless experiments and journeys retain their existing meaningful progress instead of synthetic achievement scores.

Component tests complete both daily modes, verify separate storage and pin a session across midnight. Browser tests verify actual PNG download/signature/dimensions and mode-separated badges. The new extras retain keyboard buttons, text/shape badge states, reduced-motion behavior and mobile layouts.

### Four-game upgrades (2026-10-16)

- **One Second Off:** result/done timer pads now show the actual stopped time (three decimal places), with an accessible result label; the next round restores its own target.
- **Tiny Ecosystem:** brush interaction replaced by a species tray with mouse/touch pointer-capture dragging. Plants, bushes, rabbits and foxes can be dropped onto dry land; unsuccessful/out-of-bounds/sky/pond drops spend no action. Keyboard selection plus “Place selected in habitat” provides an equivalent path. Generated realistic animal cutouts, independent decorative wandering/breathing, plant sway, pause and reduced-motion support are included. Reset also clears placed coordinates. The population model and two-action budget are unchanged.
- **Life Stats:** day/month/year dropdowns replace the native date field; leap-year/month transitions invalidate impossible days, future dates cannot be calculated, and the year snapshot is hydration-safe. Existing local-midnight calculations are retained.
- **Gravity Golf:** six additional maps bring the total to nine. Stronger inverse-square attraction is summed from all planets; field arrows and shaded/ringed planets make sources visible. Physics stays deterministic at 1/120 s; all nine maps have verified reachable goals. `gravity-v2` record suffixes keep old lower-gravity scores separate.

Verification: 114 unit/component tests passed across 26 files; lint with zero warnings, typecheck and formatting passed. Browser coverage includes measured timer results, actual mouse and touch dragging, charged/rejected placements, movement/pause/reduced-motion, mobile leap-day selection and no horizontal overflow, nine-map selection and winning shots on every map. A single-worker full run passed 54/55 cases; the existing cache-cleanup test probed across its intentional reload. That regression now retries only destroyed navigation contexts and waits for the actual restored gallery. A two-worker diagnostic run was unreliable in this constrained Chromium environment (38/55); all 17 failures passed when rerun with one worker. Every browser case has therefore passed after the test readiness repair, but the final confirmation was a selective rerun, not another all-green single full run. Production static export passed, including both optimized animal sprites. Existing Next.js middleware/Edge/Open Graph export diagnostics remain unchanged.
