# Neal.fun V2

[![Build](https://github.com/lolrobine/nealarp/actions/workflows/deploy.yml/badge.svg)](https://github.com/lolrobine/nealarp/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An open-source reimagining of [neal.fun](https://neal.fun) — a collection of quirky, interactive web experiences with modern stack, PWA, a11y, and extensive polish.

## 🎮 Experiences (38 + template)

| #   | Experience               | Description                | Highlights                                                                                                                  |
| --- | ------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | 💰 **Spend Money**       | Spend $1T on 40+ items     | Search, sort, encouragement, confetti 50%/100%, receipt export, favorites, recently played                                  |
| 2   | 🔐 **The Password Game** | 20 absurd password rules   | Progress bar, timer, copy, shake, confetti, localStorage persistence                                                        |
| 3   | 🌊 **The Deep Sea**      | Scroll 11km, 20 creatures  | CSS bubbles, RAF throttle, discovery counter, mini progress map, jump-to-depth slider, creature modal, ambient sound toggle |
| 4   | ⚡ **Speed**             | Snail to light (log scale) | Race track animation, compare 2 items, unit toggle km/h/mph/m/s, Earth/Moon time calc                                       |
| 5   | 📊 **Life Stats**        | Birthday → stats           | 20+ stats (Mars years, Moon orbits, water drunk), animated numbers, share + export as image, life expectancy bar            |
| 6   | ⭕ **Perfect Circle**    | Draw circle, Kasa fit      | Best score + history (20), ghost circle, confetti 90%+, export + replay                                                     |
| 7   | 🌌 **Size of Space**     | Atoms to universe          | Log scale, comparison mode with relative bar, zoomable canvas, journey mode (20s auto), click to highlight                  |
| 8   | ☄️ **Asteroid Launcher** | Impact simulator           | Crater canvas visualization, casualty estimate by location (ocean to megacity), known craters comparison, presets           |

New singleplayer games:

- **One Second Off** (`/one-second-off`): hidden timer, 3/7/10-second targets, single rounds or three-round sessions. Switching tabs cancels the current attempt without scoring it.
- **Trust Your Eyes** (`/trust-your-eyes`): six midpoint, center and angle challenges, pointer and keyboard controls, normalized accuracy scores.

Both games store only personal bests locally (versioned `nealarp:best:v1:` keys), offer a reset button and remain playable when storage is unavailable. No accounts, multiplayer or leaderboards. Unfinished sessions are not persisted.

### Additional singleplayer experiences (stages 2–5)

| Experience                                          | First release                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Color Memory** (`/color-memory`)                  | Five rounds, three-second memorization, neutral pause, RGB reconstruction, last ten scores                                     |
| **Which Is More?** (`/which-is-more`)               | Ten exact measurement puzzles, speed/size categories, answer explanations, saved best streak, unlimited unscored practice      |
| **The Form Game** (`/form-game`)                    | Ten dependent but solvable approvals, hints, locally restored progress, complete ending                                        |
| **Pack It Perfectly** (`/pack-it-perfectly`)        | Three hand-built solvable suitcase levels, rotation, removal, undo, per-level personal bests                                   |
| **Gravity Golf** (`/gravity-golf`)                  | Nine solvable courses, stronger inverse-square gravity, optional field arrows, partial trajectory preview, eight shots per run |
| **How Deep Can You Dig?** (`/how-deep-can-you-dig`) | Eight discoveries, revisit navigation, saved journey, source links and approximate Earth model                                 |
| **Tiny Ecosystem** (`/tiny-ecosystem`)              | Twelve-turn solo survival, two interventions per turn, population history, explicit fictional rates                            |
| **One Small Change** (`/one-small-change`)          | One restitution experiment, fixed reference, height plot and accessible data table                                             |

These releases add no accounts, network gameplay, leaderboard, API or application dependency. Comparison puzzles use explicitly fictional supplied measurements and exact arithmetic rather than unverified real-world records. Earth descriptions link to USGS/NASA references; the drill is fictional. Both physics experiences and the ecosystem disclose their model assumptions.

Best scores use `nealarp:best:v1:` keys. Form approvals and digging discoveries use validated `nealarp:progress:v1:` data; each experience has reset controls. If a write fails, progress remains usable for the current session. Other unfinished sessions restart on reload.

See [the rollout and verification notes](docs/singleplayer-rollout.md) for scope and checks.

Template: `app/(experiences)/_template/` — scaffold for new experiences.

### Wave 1–3: twenty new games

All twenty ship with pure `logic.ts` modules and unit tests (including BFS-verified solvability for the authored puzzle levels), local-only personal bests, touch + keyboard parity, silent-first audio and `prefers-reduced-motion` handling. Timing games offer practice/speed options.

| Game                                           | Core mechanic                                                                                    | Notes                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Growbox** (`/growbox`)                       | Place eight items; hidden pre/post effects grow each one twice                                   | Brute-force-tested perfect order, score = levels / 16                        |
| **Copy Machine** (`/copy-machine`)             | Hand-copy a model drawing across five generations                                                | Chamfer-distance scoring, drift film, 1200×630 lineage PNG export            |
| **Twin Tilt** (`/twin-tilt`)                   | Rotate one room to slide two marbles onto their own goals                                        | Eight BFS-verified rooms with exact pars, undo, landing previews             |
| **Word Square Studio** (`/word-square-studio`) | Build true word squares that read the same across and down                                       | Ten exhaustive-search squares (3×3 and 4×4), decoy words, mirror solutions   |
| **Clue School** (`/clue-school`)               | Solve original cryptic clues; open the plain-language wordplay lesson                            | Eight original clues (hidden, anagram, charade, double definition)           |
| **Backronym Studio** (`/backronym-studio`)     | Write phrases whose word initials spell a hidden word                                            | Constraint cards + fully visible rubric, daily letter pools                  |
| **Stack Ledger** (`/stack-ledger`)             | Drop swinging numbered blocks; each must sit on an equal or higher number                        | Fixed-step pendulum, practice/speed paces, topple rule                       |
| **Lava Links** (`/lava-links`)                 | Hop one or two hex tiles; the tile you leave crumbles                                            | Seven BFS-verified levels, click-to-hop plus direction buttons               |
| **Ice Post** (`/ice-post`)                     | Slide-to-wall across the ice while the postman walks his patrol                                  | Ten BFS-verified levels, postman blocks and advances each slide              |
| **Gate Crash** (`/gate-crash`)                 | Read the rule during its preview, then crash the one gate it describes                           | Deterministic seeded rounds, 2s/3s/5s previews + keep-visible practice       |
| **Pocket Sand** (`/pocket-sand`)               | Falling-sand sandbox (48×32 typed-array CA) with six sculpt goals                                | Sand/water/wall materials, goal scoring with precision penalty               |
| **Stockroom Six** (`/stockroom-six`)           | Twelve days of ordering stock against fictional demand                                           | Newsvendor scoring, fictional-numbers banner, seeded seasons                 |
| **Tiny Town Tactics** (`/tiny-town-tactics`)   | Sixteen-tile placement puzzle with a complete adjacency scoring sheet                            | Inspired by ISLANDERS (The Station), deterministic tile sequences            |
| **Pocket Alchemist** (`/pocket-alchemist`)     | Mix twelve ingredients with hidden trait vectors                                                 | Nearest-concept geometry instead of copied recipes (Little Alchemy 2)        |
| **Orbit Orchard** (`/orbit-orchard`)           | Launch a seed through fruit rings around a toy star                                              | Fixed 1/120 s integrator, optional trajectory preview                        |
| **Pass the Pencil** (`/pass-the-pencil`)       | Drawing telephone with memory rounds and privacy handoff notes                                   | Original prompt deck (Telestrations/Gartic Phone inspired), solo dry-run     |
| **Block Talk** (`/block-talk`)                 | Describe an A1–D4 block pattern — or beat your own memory at it                                  | Overlap % scoring (intersection over union), two-player instructions         |
| **Current Courier** (`/current-courier`)       | Draw one unbroken route through every delivery stop                                              | Flight Control-style drawing, par-length scoring, seven BFS-verified maps    |
| **Lane General** (`/lane-general`)             | Draft three units and watch a deterministic right-to-left resolver                               | Super Auto Pets-inspired, visible stats and traits, seeded enemies           |
| **Light Loom** (`/light-loom`)                 | Place prisms and mirrors so one lamp colours every target (red straight, green left, blue right) | Lazors-style optics, pure tracer, four placement puzzles that start unsolved |

## 🔒 Site Password

The whole site (every experience, plus the 404 page) sits behind a password screen. The password is **`nealarp`** unless you change it.

- The password is only stored as a digest in `lib/auth/sitePassword.ts` — the plaintext is never in the code or the bundle.
- Once entered, the unlock is remembered in `localStorage`, so visitors are asked only once per browser. The small lock button in the bottom-left corner locks the site again.

### Changing the password

```bash
corepack pnpm password:hash "my new password"
```

Paste the two digests it prints into `DEFAULT_PASSWORD_SHA256` / `DEFAULT_PASSWORD_FNV1A` in `lib/auth/sitePassword.ts`.

Alternatively, set `NEXT_PUBLIC_SITE_PASSWORD` at build time (this value is embedded verbatim in the bundle):

```bash
NEXT_PUBLIC_SITE_PASSWORD="my new password" corepack pnpm build
```

> **Security note:** GitHub Pages serves this site as a static export, so the password gate runs in the browser. It keeps casual visitors out, but the page markup is still part of the published bundle — it is not access control. The repository's current `middleware.ts` also does not reject locked requests; do not rely on it to protect private content. For a private deployment, use and test proper server-side or host-level access control.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (Node 22 is pinned in `.nvmrc`)
- Corepack (uses the repository-pinned pnpm 9.15.0)

### Install & Run

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
corepack pnpm build
```

## 📦 Adding large files (e.g. 160MB)

This repository is configured to use Git LFS for large binary files.

1. Install Git LFS once:
   ```bash
   git lfs install
   ```
2. Put large files in `public/large-files/` (or use tracked extensions like `.mp4`, `.mov`, `.zip`, `.pdf`)
3. Add and commit as normal:
   ```bash
   git add <your-file>
   git commit -m "Add large file with Git LFS"
   ```

## 🌐 Deployment

### GitHub Pages (Recommended)

1. Make this repo **public** (Settings → General → Danger Zone)
2. Go to **Settings → Pages**
3. Set Source to **GitHub Actions**
4. Push to `main` — the workflow auto-deploys

Your site will be live at: `https://<username>.github.io/nealarp/`

### Vercel

1. Import this repo on [vercel.com](https://vercel.com)
2. Keep the default Next.js build settings; the config automatically disables the GitHub Pages base path and static export on Vercel
3. Deploy!

## ✨ Key Features

- **Homepage**: search (title/desc/tags), category filter, favorites (Zustand persist), recently played (last 20), random button (R key), keyboard nav (arrows + Enter), sort (recent/featured/alpha/category), clear buttons
- **Experience Shell**: back button, share (Web Share API + clipboard), fullscreen, theme toggle, skip link, PWA service worker, JSON-LD breadcrumbs
- **Security**: client-side password gate with SHA-256 + FNV-1a fallback and exponential backoff; server response headers on Vercel. The gate is not access control for private content.
- **PWA**: `manifest.webmanifest`, `sw.js` caching, `PWARegister`, favicon, opengraph images per experience
- **A11y**: prefers-reduced-motion, focus-visible, aria-pressed, aria-live, aria-valuetext, keyboard handlers, skip links
- **DX**: `CONTRIBUTING.md`, `_template` scaffold, `.nvmrc` 22, `engines`, `lint-staged` + `husky`, `playwright` e2e, `bundle-analyzer`, `zod` registry validation, `noUncheckedIndexedAccess`

## 🤖 AI coding agents

- [`AGENTS.md`](AGENTS.md) contains the current repository instructions and verification commands.
- [`docs/agent-resources.md`](docs/agent-resources.md) lists external agent-skill repositories to review; it does not vendor them into the application.
- Historical plans are in [`docs/archive/`](docs/archive/) and are not current specifications.

## 🛠️ Tech Stack

- **Framework:** Next.js 16.4 (App Router, static export for GitHub Pages)
- **Language:** TypeScript 5 (strict + `noUncheckedIndexedAccess`)
- **Styling:** Tailwind CSS v4 + `tailwind-merge` + CSS variables
- **Animation:** Framer Motion 11
- **State:** Zustand 5 (persist)
- **Validation:** Zod 4
- **Testing:** Vitest 5 + Testing Library + Playwright 1.64
- **Tooling:** Prettier, ESLint (next/core-web-vitals), Husky, lint-staged, bundle-analyzer

## 📁 Project Structure

```
nealarp/
├── app/
│   ├── (home)/                  # Homepage
│   ├── (experiences)/
│   │   ├── spend-money/         # 💰
│   │   ├── password-game/       # 🔐
│   │   ├── deep-sea/            # 🌊
│   │   ├── speed/               # ⚡
│   │   ├── life-stats/          # 📊
│   │   ├── perfect-circle/      # ⭕
│   │   ├── size-of-space/       # 🌌
│   │   ├── asteroid-launcher/   # ☄️
│   │   ├── one-second-off/     # Hidden timer
│   │   ├── trust-your-eyes/    # Visual precision
│   │   ├── color-memory/       # Color recall
│   │   ├── which-is-more/      # Measurement quiz
│   │   ├── form-game/          # Bureaucratic puzzle
│   │   ├── pack-it-perfectly/  # Suitcase levels
│   │   ├── gravity-golf/       # Toy-gravity levels
│   │   ├── how-deep-can-you-dig/ # Earth journey
│   │   ├── tiny-ecosystem/     # Turn-based balancing
│   │   └── one-small-change/   # Single-parameter experiment
│   └── layout.tsx
├── content/
│   └── experiences.json         # Experience registry
├── docs/
│   ├── agent-resources.md       # External AI-agent references
│   └── archive/                 # Historical plans and audits
├── AGENTS.md                    # Repository instructions for coding agents
├── lib/
│   ├── auth/
│   │   └── sitePassword.ts      # 🔒 Site password digests & unlock storage
│   ├── components/              # Shared UI (incl. PasswordGate)
│   ├── store/                   # Zustand stores
│   └── utils/
├── scripts/
│   └── password-hash.mjs        # corepack pnpm password:hash
└── .github/workflows/
    └── deploy.yml               # GitHub Pages deploy
```

## 📝 License

MIT

## Realistic covers and direct interaction

All eighteen catalogue cards now use distinct local AI-generated photorealistic covers, served as optimized 960 × 540 WebP files (about 25–152 KB each), with matching SVG icons. Illustrated covers remain as source fallbacks, not the active gallery thumbnails. These images are creative artwork, not documentary photographs or scientific observations.

Generated JPEG masters live beside their optimized `realistic.webp` files. Run `node scripts/optimize-realistic-thumbnails.mjs` to resize/compress available masters and register them. Run `node scripts/build-thumbnails.mjs` to regenerate SVG icons/fallbacks; this preserves photographic covers. Afterwards run `corepack pnpm exec prettier --write content/experiences.json`. No remote runtime images or new application dependencies are required.

- Gravity Golf: nine courses with stronger combined planetary attraction, shaded planets and optional force arrows; drag to aim, then watch, pause, resume or skip a curved flight.
- Pack It Perfectly: preview valid/invalid placements by hovering or focusing cells; optionally drag pieces onto the grid. Tap/keyboard placement remains available.
- Tiny Ecosystem: drag plants, bushes, realistic rabbit/fox sprites from the species tray onto dry grass with a mouse or touch. Placement costs one intervention; keyboard placement and numeric controls remain available. Animals wander and breathe visually, with a pause toggle and reduced-motion support.
- One Small Change: replay two bouncing balls, pause, and scrub the full eight-second timeline.
- Digging: animated drill and clickable discovered stations; reset and revisit without losing local progress.
- Color Memory: open the direct color mixer or use RGB sliders.
- Which Is More?: keyboard choices 1/2 and visual answer comparisons.
- The Form Game: tap approval stamps to review prior answers.
- One Second Off: large clickable timer pad shows the actual stopped time after each round, plus visual round-score feedback.

Motion is presentational only. Physics stays deterministic, scoring does not depend on frame rate, and reduced-motion mode skips automatic replays. Replay effects clean up when leaving a game.

## Personal daily tasks, achievements and result cards

- **Color Memory** and **Which Is More?** include an optional “Play today's challenge” mode. Colors and comparison order/sides are deterministically seeded from the player's local calendar date. The date is captured on selection and stays fixed across midnight for that session; restarting keeps the same task. Standard sessions remain available.
- Daily records use separate dated, versioned `nealarp:best:v1:` keys. They do not overwrite standard bests or standard Color Memory history. These are solo tasks, not a shared competition: no rankings, account, attendance streak or missed-day penalty.
- The seven score-based additions (One Second Off, Trust Your Eyes, Color Memory, Which Is More?, Pack It Perfectly, Gravity Golf and Tiny Ecosystem) show **local achievements** for First Finish, Bronze (60), Silver (80), Gold (95) and Perfect (100). They derive from that mode/level's saved best; resetting the best also resets its badges.
- **Download result card** exports that saved best as a local 1200 × 630 PNG. It includes only the game, mode/date and score, not form answers or other personal data. No upload or sharing service is used. Games without a normalized score keep their existing progress/results rather than inventing a score.
- Development removes old Nealarp service workers and caches (not unrelated apps' caches), then reloads a controlled tab once. Production revalidates HTML and game artwork online and retains an offline fallback; only hashed Next assets stay cache-first. A fresh preview origin avoids previously cached documents before the cleanup code can run.

For an already-running preview on another port, browser tests accept `PLAYWRIGHT_BASE_URL=http://localhost:3001`.

### Latest four-game interaction update

Life Stats now uses separate day/month/year dropdowns, validates leap years and prevents future birthdays. Changing the month or year clears an impossible day instead of silently rolling it into another month. Birthday calculations retain local-calendar semantics.

Gravity Golf now has nine courses (six additional maps). The stationary planets exert a stronger summed inverse-square pull, so trajectories visibly curve. The model remains a toy in arbitrary units, not a real astronomical simulation. All nine maps have tested winning shots within the offered controls. New results use `gravity-v2` mode keys, leaving the old lower-gravity bests untouched rather than comparing different physics.

Tiny Ecosystem's rabbit and fox art is AI-generated promotional game artwork. Original PNG masters and optimized transparent local WebP sprites are kept under `public/experiences/tiny-ecosystem/`. `node scripts/optimize-ecosystem-sprites.mjs` removes edge-connected source backgrounds and generates the lightweight sprites with the existing image toolchain. Plants and bushes both add ten plant units; each rabbit/fox adds one animal unit. Coordinates and cosmetic CSS movement do not alter population calculations or survival scores. Movement can be paused and is disabled for reduced-motion preferences.
