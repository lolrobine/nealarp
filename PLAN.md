# 🚀 Neal.fun V2 — Build Plan

> An open-source reimagining of [neal.fun](https://neal.fun) — a collection of quirky, interactive web experiences.

---

## 1. Vision

Build a modern, open-source platform that hosts multiple interactive web experiments and games — inspired by Neal Agarwal's neal.fun — but rebuilt from scratch with a modern stack, plugin architecture for adding new experiences, and a beautiful unified homepage.

---

## 2. Architecture Overview

```
nealarp/
├── app/                        # Next.js app (monorepo root)
│   ├── (home)/                 # Landing page route group
│   │   ├── page.tsx            # Homepage with experience cards
│   │   └── layout.tsx
│   ├── (experiences)/          # Individual experiences
│   │   ├── layout.tsx          # Shared chrome: nav, back button, dark mode
│   │   ├── infinite-craft/     # Element combination game
│   │   ├── password-game/      # Absurd password creator
│   │   ├── spend-money/        # Spend a billionaire's money
│   │   ├── deep-sea/           # Scroll through ocean depths
│   │   ├── size-of-space/      # Scroll through cosmic scales
│   │   ├── speed/              # Speed comparison visualizer
│   │   ├── life-stats/         # Life statistics calculator
│   │   ├── asteroid-launcher/  # Asteroid impact simulator
│   │   └── perfect-circle/     # Draw a perfect circle challenge
│   ├── api/                    # API routes (AI combos, data)
│   └── layout.tsx              # Root layout
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── experiences/            # Experience registry & types
│   └── utils/                  # Shared utilities
├── public/
│   ├── experiences/            # Static assets per experience
│   └── data/                   # JSON data files
├── content/
│   └── experiences.json        # Experience metadata registry
├── tailwind.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── PLAN.md
```

---

## 3. Tech Stack

| Layer              | Choice                  | Why                                        |
|--------------------|-------------------------|--------------------------------------------|
| **Framework**      | Next.js 15 (App Router) | SSR/SSG hybrid, API routes, great DX       |
| **Language**       | TypeScript              | Type safety across 10+ independent apps    |
| **Styling**        | Tailwind CSS v4         | Utility-first, dark mode, rapid prototyping|
| **Animation**      | Framer Motion           | Smooth transitions, gesture support        |
| **State**          | Zustand                 | Lightweight, no boilerplate                |
| **3D / Canvas**    | Three.js + R3F          | For Space Elevator, Asteroid Launcher      |
| **2D Physics**     | Matter.js               | For Asteroid Launcher, physics sims        |
| **Drawing**        | Canvas API + Rough.js   | For Perfect Circle, Constellation Draw     |
| **Charts/Viz**     | D3.js                   | For Deep Sea, Size of Space, Speed         |
| **AI (optional)** | OpenAI API              | For Infinite Craft combo generation          |
| **Testing**        | Vitest + Playwright     | Unit + E2E per experience                  |
| **Deployment**     | Vercel                  | Edge functions, preview deploys            |
| **Monorepo**       | pnpm workspaces         | Fast installs, shared packages             |

---

## 4. Core Platform Features

### 4.1 Homepage (`/`)
- **Hero section** with animated title and tagline
- **Experience grid** — card-based layout with hover previews (animated thumbnails / GIFs)
- **Categories** — filter by type: Games, Visualizations, Educational, Absurd, Creative
- **Dark/Light mode toggle** (persisted)
- **"Currently Playing" indicator** — track what you've interacted with
- **Responsive** — mobile-first, works on all screen sizes
- **Keyboard navigation** — full a11y support

### 4.2 Experience Shell (`/(experiences)/layout.tsx`)
- Consistent **back button** to homepage
- **Experience title bar** with name + subtle branding
- **Share button** — copy link, share to social
- **Fullscreen toggle** — for immersive experiences
- **Dark mode** inherited from homepage
- **Loading skeleton** per experience
- **Error boundary** — graceful failure with retry

### 4.3 Experience Registry (`content/experiences.json`)
```json
[
  {
    "id": "infinite-craft",
    "title": "Infinite Craft",
    "description": "Combine elements to discover everything",
    "category": "game",
    "icon": "/experiences/infinite-craft/icon.svg",
    "thumbnail": "/experiences/infinite-craft/thumb.png",
    "featured": true,
    "status": "live",
    "tags": ["ai", "creative", "addictive"]
  }
]
```
- Experiences register themselves here
- Homepage reads this to build the grid dynamically
- Status: `live` | `beta` | `coming-soon`

---

## 5. Experiences to Build (Phased)

### Phase 1 — Foundation + 3 Launch Experiences

#### 🏠 Homepage & Shell
- Homepage with animated card grid
- Shared layout, navigation, dark mode
- Experience registry system
- Responsive design system

#### 🎮 Experience 1: **Spend Money** (`/spend-money`)
> Spend a trillion dollars buying everything from yachts to social media platforms.

- **Type:** Interactive shopping simulator
- **Core mechanics:**
  - Sidebar of purchasable items with real-ish prices
  - Running total of remaining money
  - Quantity selector per item
  - Satisfying purchase animations
  - Items organized by category (vehicles, companies, food, absurd)
- **Tech:** React + Framer Motion + Zustand
- **Complexity:** ⭐⭐ (Medium)
- **Data:** Static JSON of items + prices

#### 🎮 Experience 2: **The Password Game** (`/password-game`)
> Create a password that satisfies increasingly absurd rules.

- **Type:** Puzzle / game
- **Core mechanics:**
  - Password input field
  - Progressive rule system (Rule 1 → Rule 25+)
  - Each rule adds a new constraint (length, must contain date, chess move, etc.)
  - Rules stack and sometimes contradict
  - Validation indicator per rule (✅/❌)
  - Character count display
  - "Congratulations" screen on completion
- **Tech:** React + custom validation engine
- **Complexity:** ⭐⭐ (Medium)
- **Data:** Rule definitions as typed config objects

#### 🎮 Experience 3: **Deep Sea** (`/deep-sea`)
> Scroll down through the ocean and discover creatures at each depth.

- **Type:** Scroll-based visualization
- **Core mechanics:**
  - Vertical scroll mapped to ocean depth (0m → 11,000m Mariana Trench)
  - Color gradient from light blue to pitch black
  - Marine creatures appear at their real depths
  - Creature cards with facts on hover/click
  - Depth indicator always visible
  - Parallax scrolling effects
  - Ambient ocean sounds (optional toggle)
- **Tech:** React + Framer Motion scroll + SVG illustrations
- **Complexity:** ⭐⭐⭐ (High — lots of content/assets)
- **Data:** JSON of creatures with depth, name, description, SVG

---

### Phase 2 — More Experiences

#### 🎮 Experience 4: **Infinite Craft** (`/infinite-craft`)
> Start with 4 elements, combine them to discover everything.

- **Type:** AI-powered discovery game
- **Core mechanics:**
  - 4 starting elements (Earth, Water, Fire, Wind)
  - Drag-and-drop onto canvas
  - Combine any two elements → discover new one
  - AI (OpenAI) generates combo results
  - Local cache of discovered combinations
  - Side panel of all discovered elements
  - Sound effects on discovery
  - Dark mode support
- **Tech:** React + DnD library + OpenAI API + Zustand
- **Complexity:** ⭐⭐⭐⭐ (Very High — AI integration)
- **Data:** API-driven + cached in localStorage

#### 🎮 Experience 5: **Asteroid Launcher** (`/asteroid-launcher`)
> Launch asteroids at Earth and see the devastation.

- **Type:** Physics simulation
- **Core mechanics:**
  - World map you can click to target
  - Sliders for asteroid size, speed, angle, density
  - Physics simulation of impact
  - Crater visualization
  - Shockwave animation
  - Comparison to historical events (Chicxulub, Tunguska)
  - Energy release calculator
- **Tech:** React + Matter.js + Canvas + D3 (map)
- **Complexity:** ⭐⭐⭐ (High — physics engine)

#### 🎮 Experience 6: **Speed** (`/speed`)
> Compare the speed of everything — from snails to light.

- **Type:** Interactive comparison
- **Core mechanics:**
  - List of things with their speeds (animals, vehicles, phenomena)
  - Visual race track where things move at relative speeds
  - Speed slider to fast-forward time
  - Unit toggles (mph, km/h, m/s)
  - Search/filter
  - Fun facts about each speed
- **Tech:** React + Framer Motion + D3
- **Complexity:** ⭐⭐ (Medium)

#### 🎮 Experience 7: **Life Stats** (`/life-stats`)
> Enter your birthday and see mind-blowing statistics about your life.

- **Type:** Calculator / visualization
- **Core mechanics:**
  - Birthday input
  - Heartbeats since birth
  - Breaths taken
  - Times you've blinked
  - Distance Earth traveled
  - Moons of Jupiter completed
  - Real-time updating counters
  - Animated number transitions
- **Tech:** React + animated counters
- **Complexity:** ⭐ (Low — mostly math + display)

---

### Phase 3 — Advanced Experiences

#### 🎮 Experience 8: **Size of Space** (`/size-of-space`)
> Scroll through the universe from atoms to the observable universe.

- Zoom-based scale comparison
- Thousands of objects with real measurements
- Smooth zoom animation
- Tech: React + D3 + CSS transforms

#### 🎮 Experience 9: **Perfect Circle** (`/perfect-circle`)
> Try to draw a perfect circle. Get scored.

- Canvas drawing + gesture capture
- Circle fitting algorithm (least squares)
- Score based on deviation
- Replay/share
- Tech: React + Canvas API

#### 🎮 Experience 10: **Space Elevator** (`/space-elevator`)
> Ride an elevator from Earth's surface to space.

- Vertical scroll / click-to-ascend
- Atmospheric layers with facts
- 3D or animated exterior view
- Altitude meter
- Tech: React + Three.js or Canvas

---

## 6. Design System

### Colors
```
--bg-primary:      #0a0a0a (dark) / #fafafa (light)
--bg-card:         #141414 (dark) / #ffffff (light)
--accent:          #6366f1 (indigo)
--accent-hover:    #818cf8
--text-primary:    #f5f5f5 (dark) / #171717 (light)
--text-secondary:  #a3a3a3 (dark) / #525252 (light)
--border:          #262626 (dark) / #e5e5e5 (light)
--success:         #22c55e
--error:           #ef4444
```

### Typography
- **Headings:** Inter (or Geist) — clean, modern
- **Body:** Inter — highly readable
- **Monospace:** JetBrains Mono — for numbers, code-like experiences
- **Display:** Instrument Serif — for hero titles (neal.fun vibe)

### Motion Principles
- Experiences should feel **alive** — subtle idle animations
- Page transitions: smooth fade + slide
- Card hover: gentle lift + glow
- Numbers: always animate (count up/down, not instant)
- Scroll: parallax where appropriate, never jarring

---

## 7. Data Architecture

### Experience Data Pattern
Each experience owns its data:
```
/experiences/deep-sea/
  ├── data/
  │   └── creatures.json     # { name, depth, description, svg }
  ├── components/
  │   ├── CreatureCard.tsx
  │   ├── DepthIndicator.tsx
  │   └── OceanScene.tsx
  ├── hooks/
  │   └── useScrollDepth.ts
  ├── page.tsx               # The experience page
  └── styles.css             # Experience-specific styles
```

### Shared Data
```
/data/
  ├── units.ts               # Unit conversion utilities
  ├── constants.ts            # Shared constants
  └── types.ts                # Shared TypeScript types
```

---

## 8. Performance Strategy

| Concern              | Solution                                         |
|----------------------|--------------------------------------------------|
| Bundle size          | Dynamic imports per experience (lazy load)        |
| First paint          | SSG homepage, streaming SSR for experience shell |
| Images               | Next/Image with AVIF, blur placeholders          |
| Animations           | GPU-accelerated transforms, will-change          |
| Fonts                | next/font, subset to Latin                       |
| Data                 | Static JSON where possible, no DB needed         |

---

## 9. Development Milestones

### Week 1 — Foundation
- [ ] Initialize Next.js 15 + TypeScript + Tailwind + pnpm
- [ ] Set up monorepo structure with shared packages
- [ ] Build design system (colors, typography, components)
- [ ] Create homepage with animated card grid
- [ ] Build experience shell layout
- [ ] Implement dark mode
- [ ] Create experience registry system

### Week 2 — First Experience: Spend Money
- [ ] Build item data structure and sidebar
- [ ] Implement purchase logic with Zustand
- [ ] Add purchase animations (Framer Motion)
- [ ] Responsive design
- [ ] Sound effects (optional)

### Week 3 — Second Experience: Password Game
- [ ] Build rule engine architecture
- [ ] Implement 15-20 rules
- [ ] Validation UI per rule
- [ ] Completion screen
- [ ] Progressive reveal animation

### Week 4 — Third Experience: Deep Sea
- [ ] Create scroll-depth mapping system
- [ ] Design/create creature SVGs and data
- [ ] Build depth visualization
- [ ] Creature encounter cards
- [ ] Parallax and ambient effects

### Week 5-6 — Polish & Phase 2 Start
- [ ] Performance audit + optimization
- [ ] Mobile testing + fixes
- [ ] Accessibility pass (WCAG AA)
- [ ] Begin Phase 2 experiences
- [ ] Open source: README, CONTRIBUTING.md, LICENSE

---

## 10. Open Source Strategy

- **License:** MIT
- **Contributing guide:** How to add a new experience
- **Experience template:** Boilerplate for new experiences
- **Code of Conduct**
- **Issue templates** for bugs, feature requests, new experience ideas

### Adding a New Experience (Template)
```bash
# Scaffold a new experience
pnpm create-experience my-new-game
```
Generates:
- Page route with boilerplate
- Data directory
- Registers in `experiences.json`
- README with experience-specific docs

---

## 11. Key Differentiators from neal.fun

| neal.fun                    | Our V2                              |
|-----------------------------|-------------------------------------|
| Single monolithic site      | Modular, each experience isolated   |
| Closed source               | Open source, community contributions|
| No dark mode (historically) | Dark mode from day one              |
| No mobile optimization      | Mobile-first responsive design      |
| Custom per-experience tech  | Shared design system + components   |
| No API / data sharing       | Experience registry, shareable data |
| No contribution path        | Plugin architecture for new games   |

---

## 12. Risks & Mitigations

| Risk                          | Mitigation                                    |
|-------------------------------|-----------------------------------------------|
| Scope creep (too many games)  | Ship 3 experiences first, iterate            |
| Performance with many games   | Lazy load, code splitting per route          |
| AI costs (Infinite Craft)     | Cache aggressively, rate limit, free tier    |
| Asset creation (SVGs, sounds) | Use free assets first, commission later       |
| Legal (copying neal.fun)      | Build original experiences, don't copy code   |

---

## Summary

Build a modern, open-source platform with:
1. **Beautiful homepage** with animated experience cards
2. **Shared shell** for consistent UX across experiences
3. **3 launch experiences** (Spend Money, Password Game, Deep Sea)
4. **Plugin architecture** so anyone can add a new experience
5. **Modern stack** (Next.js 15, TypeScript, Tailwind, Framer Motion)

Start with Phase 1, get it live, then expand from there.
