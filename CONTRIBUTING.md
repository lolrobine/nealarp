# Contributing to Neal.fun V2

Thanks for wanting to contribute! This project is an open-source reimagining of [neal.fun](https://neal.fun).

## Quick Start

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open http://localhost:3000 — default password is `nealarp`.

## Project Structure

```
app/
  (home)/            # Homepage with search, category filter, recently played
  (experiences)/     # Shared shell (back button, share, fullscreen, theme)
    spend-money/     # Example experience
    _template/       # Boilerplate for new experiences
content/
  experiences.json   # Registry — add your experience here
lib/
  components/ui/     # Shared UI primitives (Button, Card, Badge, Slider)
  store/             # Zustand stores (theme, recently-played, spend-money)
  hooks/             # usePrefersReducedMotion, etc
  utils/             # cn(), getAssetUrl()
```

## Adding a New Experience

### 1. Scaffold

```bash
# Copy template
cp -r app/\(experiences\)/_template app/\(experiences\)/my-new-game
```

Or create manually:

```
app/(experiences)/my-new-game/
  layout.tsx   # metadata (title, description)
  page.tsx     # client component — your game
  data.ts      # optional static data
```

### 2. Minimal page.tsx

```tsx
"use client";

import { useState } from "react";
import { GameIcon } from "@/lib/components/GameIcon";

export default function MyNewGamePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="flex items-center gap-3 text-4xl font-bold">
        <GameIcon
          src="/experiences/my-new-game/icon.webp"
          alt="My New Game icon"
          className="h-10 w-10 rounded-lg"
        />
        My New Game
      </h1>
      {/* Your interactive UI here */}
    </div>
  );
}
```

### 3. Minimal layout.tsx

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My New Game — Neal.fun V2",
  description: "Short description for SEO and sharing",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

### 4. Register in content/experiences.json

```json
{
  "id": "my-new-game",
  "title": "My New Game",
  "description": "What it does in one sentence",
  "category": "game",
  "icon": "/experiences/my-new-game/icon.webp",
  "thumbnail": "/experiences/my-new-game/thumbnail.webp",
  "featured": true,
  "status": "live",
  "tags": ["fun", "new"]
}
```

Categories: `game`, `visualization`, `simulation`, `calculator`
Status: `live`, `beta`, `coming-soon`

### 5. Add assets

Put icon (48x48) and thumbnail (16:9) in `public/experiences/my-new-game/` as webp.

### 6. Test

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
corepack pnpm test
corepack pnpm test:e2e
corepack pnpm build
```

## Code Guidelines

- **Client components:** Add `"use client"` at top if using hooks, Zustand, or browser APIs
- **Accessibility:** All interactive elements need `aria-label`, focus ring (`focus-visible:ring`), keyboard support
- **Performance:** Use `useMemo`, `React.memo`, `useRef` for points/canvas, avoid state on every mousemove
- **Styling:** Use `cn()` from `lib/utils/cn.ts` (includes `tailwind-merge`), use CSS variables `bg-[var(--card)]` etc
- **State:** Prefer Zustand with selectors to avoid re-rendering all cards
- **Reduced motion:** Check `usePrefersReducedMotion()` to disable heavy animations

## UI Primitives

Use shared components from `lib/components/ui/`:

```tsx
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { Badge } from "@/lib/components/ui/badge";
import { Slider } from "@/lib/components/ui/slider";

<Button variant="default" size="lg">Play</Button>
<Card className="p-6">...</Card>
<Badge variant="primary">#fun</Badge>
<Slider label="Speed" value={speed} onChange={...} />
```

## Testing

```bash
corepack pnpm test        # run all Vitest tests
corepack pnpm test:watch  # watch mode
corepack pnpm test:e2e    # run Playwright browser tests
corepack pnpm format:check
```

Add tests for calculators/rules in `*.test.ts` alongside your experience.

## Commit Messages

Use conventional commits:

```
feat: add my-new-game experience
fix: correct fiber optic speed
perf: optimize deep-sea scroll with RAF
a11y: add aria-pressed to category filters
```

## Pull Request

1. Fork, create branch `feat/my-new-game`
2. Ensure `corepack pnpm build` passes and no a11y issues
3. Open PR against `main` with screenshots

## Questions?

Open an issue or discussion on GitHub.
