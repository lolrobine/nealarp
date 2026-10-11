Made with ai
# Neal.fun V2

An open-source reimagining of [neal.fun](https://neal.fun) — a collection of quirky, interactive web experiences.

## 🎮 Experiences

| # | Experience | Description |
|---|-----------|-------------|
| 1 | 💰 **Spend Money** | Spend $1 trillion on 40+ items |
| 2 | 🔐 **The Password Game** | 20 increasingly absurd password rules |
| 3 | 🌊 **The Deep Sea** | Scroll through ocean depths, discover 20 creatures |
| 4 | ⚡ **Speed** | Compare speeds from snails to light |
| 5 | 📊 **Life Stats** | Birthday → mind-blowing life statistics |
| 6 | ⭕ **Perfect Circle** | Draw a perfect circle and get scored |
| 7 | 🌌 **Size of Space** | Cosmic scale visualization |
| 8 | ☄️ **Asteroid Launcher** | Launch asteroids and see the devastation |

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

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **State:** Zustand

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
