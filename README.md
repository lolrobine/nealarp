# Neal.fun V2

An open-source reimagining of [neal.fun](https://neal.fun) — a collection of quirky, interactive web experiences.

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
nealarp/
├── app/                        # Next.js app (App Router)
│   ├── (home)/                 # Landing page route group
│   │   ├── page.tsx            # Homepage with experience cards
│   │   └── layout.tsx
│   ├── (experiences)/          # Individual experiences
│   │   ├── layout.tsx          # Shared chrome: nav, back button, dark mode
│   │   ├── spend-money/        # Spend a billionaire's money
│   │   ├── password-game/      # Absurd password creator
│   │   └── deep-sea/           # Scroll through ocean depths
│   └── layout.tsx              # Root layout
├── lib/
│   ├── components/             # Shared UI components
│   ├── store/                  # Zustand stores
│   └── utils/                  # Shared utilities
├── content/
│   └── experiences.json        # Experience metadata registry
├── public/
│   └── experiences/            # Static assets per experience
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **State:** Zustand

## License

MIT
