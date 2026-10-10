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
│   ├── components/              # Shared UI
│   ├── store/                   # Zustand stores
│   └── utils/
└── .github/workflows/
    └── deploy.yml               # GitHub Pages deploy
```

## 📝 License

MIT
