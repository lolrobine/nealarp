# Neal.fun V2

[![Build](https://github.com/lolrobine/nealarp/actions/workflows/deploy.yml/badge.svg)](https://github.com/lolrobine/nealarp/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An open-source reimagining of [neal.fun](https://neal.fun) — a collection of quirky, interactive web experiences with modern stack, PWA, a11y, and extensive polish.

## 🎮 Experiences (8 + template)

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

Template: `app/(experiences)/_template/` — scaffold for new experiences.

## 🔒 Site Password

The whole site (every experience, plus the 404 page) sits behind a password screen. The password is **`nealarp`** unless you change it.

- The password is only stored as a digest in `lib/auth/sitePassword.ts` — the plaintext is never in the code or the bundle.
- Once entered, the unlock is remembered in `localStorage`, so visitors are asked only once per browser. The small lock button in the bottom-right corner locks the site again.

### Changing the password

```bash
pnpm password:hash "my new password"
```

Paste the two digests it prints into `DEFAULT_PASSWORD_SHA256` / `DEFAULT_PASSWORD_FNV1A` in `lib/auth/sitePassword.ts`.

Alternatively, set `NEXT_PUBLIC_SITE_PASSWORD` at build time (this value is embedded verbatim in the bundle):

```bash
NEXT_PUBLIC_SITE_PASSWORD="my new password" pnpm build
```

> **Note:** GitHub Pages serves this site as a static export, so the gate runs in the browser. It keeps casual visitors out, but the page markup is still part of the published bundle — it is not server-side access control. On a host with a server (Vercel, `next start`), you can add a `middleware.ts` to enforce the password before any HTML is served.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
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
- **Security**: client-side password gate with SHA-256 + FNV-1a fallback, rate limiting (exponential backoff), Vercel middleware, security headers (X-Frame-Options DENY, etc)
- **PWA**: `manifest.webmanifest`, `sw.js` caching, `PWARegister`, favicon, opengraph images per experience
- **A11y**: prefers-reduced-motion, focus-visible, aria-pressed, aria-live, aria-valuetext, keyboard handlers, skip links
- **DX**: `CONTRIBUTING.md`, `_template` scaffold, `.nvmrc` 22, `engines`, `lint-staged` + `husky`, `playwright` e2e, `bundle-analyzer`, `zod` registry validation, `noUncheckedIndexedAccess`

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5 (App Router, static export for GH Pages, middleware for Vercel)
- **Language:** TypeScript 5.7 (strict + noUncheckedIndexedAccess)
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
│   │   └── asteroid-launcher/   # ☄️
│   └── layout.tsx
├── content/
│   └── experiences.json         # Experience registry
├── lib/
│   ├── auth/
│   │   └── sitePassword.ts      # 🔒 Site password digests & unlock storage
│   ├── components/              # Shared UI (incl. PasswordGate)
│   ├── store/                   # Zustand stores
│   └── utils/
├── scripts/
│   └── password-hash.mjs        # pnpm password:hash
└── .github/workflows/
    └── deploy.yml               # GitHub Pages deploy
```

## 📝 License

MIT
