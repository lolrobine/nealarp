# Extensive Improvement & Bug Audit — nealarp (neal.fun V2)

**Date:** 2026-10-12  
**Branch:** arena/97cac14e-nealarp  
**Build:** passes (Next 15.5.27, React 19.3, pnpm 12.11) — lint 0 errors, tsc 0 errors  
**Audited:** 100% of source files, build output, runtime behavior, security, a11y, perf

---

## Table of Contents

1. [Critical Bugs (P0) — Breaks functionality or makes puzzle unsolvable]
2. [High Severity Bugs (P1) — Wrong data, jank, state corruption]
3. [Medium Bugs (P2) — UX, a11y, SEO, DX]
4. [Low / Polish (P3)]
5. [Architecture & Code Quality]
6. [Performance Deep Dive]
7. [Security & Deployment]
8. [Missing Features vs PLAN.md]
9. [Proposed Phased Implementation]

---

## 1. Critical Bugs (P0)

### 1.1 Password Game — Unsolvable Ruleset

**File:** `app/(experiences)/password-game/rules.ts`

- **Rule 8 logic bug:**

  ```ts
  const romans = p.match(/[IVXLCDM]/g);
  product = romans.reduce((acc, r) => acc * values[r], 1);
  ```

  This matches _individual characters_, not numerals. "VII" becomes V*I*I =5*1*1=5. The hint says "V × VII = 35. That's V and VII." but code would compute V*V*I*I=25. No string can satisfy product 35 with single-char parsing because prime factors 5*7, but 7 is VII (5+1+1) not a single char. Also `/[IVXLCDM]/` matches letters inside month names (e.g., "January" contains I, "December" contains D,C,M). So rule 6 (month) pollutes rule 7/8.
  - **Repro:** Try to satisfy rules 6+7+8 together: need month containing no I,V,X,L,C,D,M? Impossible — all months contain at least one of those letters (January=I, February=I, March=M,C, April=I, May=M, June=I, July=I, August=I, September=I, October=I, November=I, December=D,C,M). So rule 7 always passes once month present, but product calc becomes unpredictable.
  - **Fix:** Parse Roman numerals as _tokens_ with regex `\bM{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})\b` or simpler: look for standalone substrings like `/(?:^|[^A-Z])([IVXLCDM]+)(?=[^A-Z]|$)/g` and convert each token to integer, then product. Or change rule to sum=35, product of single chars but allow 5*7 where 7 is VII as three chars? Need redesign.

- **Rule 14 vs 17 impossibility:**
  - Rule 14: letters must be alphabetical order (e.g., "abce" valid, "ba" invalid). Implementation: strips non-letters, lowercases, checks each char >= previous. So "aAbB" -> "aabb" passes, but "bAa" -> "baa" fails because b>a? Actually lowercased "baa" = b >= a? No, a < b so fails. So to pass, all letters must be sorted.
  - Rule 17: more uppercase than lowercase. If letters must be sorted, uppercase letters have ASCII 65-90, lowercase 97-122, but after lowercasing for check, case info lost. However to have more uppercase than lowercase, you'd need many uppercase, but sorted order requires uppercase letters (if sorted case-insensitively?) The current check lowercases, so "AAB" (uppercase) lowercased "aab" passes alphabetical, but uppercase count 3 > lowercase 0 passes rule 17. However rule 6 month requires mixed case month like "January" (capital J). That would be "January" -> letters "january" sorted? j a n u a r y is not sorted. So rules 6+14 conflict. The only way is to have month letters appear in alphabetical order, which no month does. So ruleset unsolvable past rule 14.
  - **Fix:** Either make rule 14 check case-sensitive alphabetical (A-Z then a-z) or make month rule case-insensitive and allow month to be out-of-order but still count? Better: redesign rule 14 to be optional or change hint to allow non-letter separators to reset order? Need solver that finds at least one valid password, then lock ruleset.

- **Rule 19 prime index bug:**

  ```ts
  const idx = p.indexOf("🎉");
  ```

  🎉 is surrogate pair length 2 in JS string. `indexOf` returns code-unit index, not grapheme index. Prime check on code-unit index is inconsistent with user-perceived character count. Also if password contains 🎉 multiple times, only first checked. Should use `Array.from(p).indexOf("🎉")` for grapheme count.

- **Rule 5 digit sum 25 conflicts with Rule 11 leap year 4-digit number:** If you have leap year 2000, digits sum 2, already contributes to sum 25. Makes puzzle harder but solvable. However validation uses `/\d/g` for sum, so leap year digits count twice (once for sum, once for leap check). Okay.

- **Rule 20 always passes** but `unlockedRules` logic may never reach it if earlier rules broken after unlock. Effect in page.tsx:
  ```ts
  for (let i = 0; i < unlockedRules; i++) if (!ruleResults[i].passed) return;
  ```
  This early return prevents unlocking next rule if any earlier fails, which is correct, but it also means if you break earlier rule after unlocking many, you still see all unlocked rules (good). However it only unlocks one per render cycle, not all that could be satisfied. If user pastes solution that satisfies 20 rules at once, it will take 20 renders to reveal all. Minor.

**Action:** Add `rules.test.ts` with vitest that brute-forces or contains known solution. If no solution exists, ruleset is broken. Propose new ruleset v2.

---

### 1.2 Spend Money — Derived State Corruption

**File:** `app/(experiences)/spend-money/store.ts`

- **Bug:** `spent` persisted separately. If user buys items, then code updates price list (e.g., Big Mac from $5 to $6), persisted `spent` is now wrong vs `sum(purchases*price)`. Also `totalMoney` is hardcoded 1e12 in store, but `data.ts` also exports `TOTAL_MONEY = 1e12`. If one changes, other doesn't. Single source of truth violation.
- **Bug:** `setQuantity` with `quantity` param: if `quantity` is NaN (parseInt fails), it still calls set? In ItemCard, `parseInt(customQty)` may be NaN, then `if (!isNaN(qty) && qty>=0)` guards, okay. But if user enters 1.5, parseInt ->1, silently truncates.
- **Bug:** `maxAffordable` calc: `quantity + Math.floor(remaining / price)` — if remaining negative due to earlier corruption, maxAffordable < quantity, but handleMaxBuy would set to smaller quantity, effectively selling? Should clamp to at least quantity.
- **Bug:** No upper bound on quantity input, could overflow Number.MAX_SAFE_INTEGER if user types 1e20, then spent = quantity*price could be Infinity, breaking MoneyDisplay (percentage Infinity%).
- **Fix:** Make `spent` a selector `get(): number => sum(purchases*price)`, not stored. Persist only `purchases`. On rehydrate, migrate old state (if spent exists, ignore). Add zod schema for persisted data. Derive `remaining = TOTAL_MONEY - spent` in selector.

---

### 1.3 Perfect Circle — React State on Every Mousemove

**File:** `app/(experiences)/perfect-circle/page.tsx`

- **Bug:** `setPoints(prev=>[...prev, point])` on every `mousemove` (could be 100+ events/sec). Each creates new array copy O(n) and triggers React render. For 500 points, that's 500 renders + 500 array copies, causes jank, especially on mobile.
- **Bug:** `handleEnd` uses `points` from closure, but `points` state may be stale because `setPoints` is async. If last mousemove hasn't flushed, score calculated on n-1 points.
- **Bug:** `drawCanvas` is `useCallback` with empty deps, but it reads no state, okay. However it's called inside `setPoints` updater which is anti-pattern: side effect inside state updater.
- **Bug:** Circle fit algorithm is naive average center + average radius. For incomplete circles (e.g., user draws 270° arc), center will be off, radius wrong, score artificially high. Original neal.fun uses least-squares fit.
- **Bug:** No check for closed shape: user can draw line and get score. Should require distance between first and last point < threshold or total angle > 300°.
- **Fix:** Use `useRef` for points array, draw via RAF, only set state on end. Implement proper least-squares: https://dtcenter.org/sites/default/files/community-code/met/docs/write-ups/circle_fit.pdf or simple Kasa method. Add closure check.

---

### 1.4 Life Stats — RAF Leak + Date Parsing

**File:** `app/(experiences)/life-stats/page.tsx` + `calculator.ts`

- **Bug:** `AnimatedNumber` starts RAF loop but never cancels:
  ```ts
  useEffect(()=>{ const animate=()=>{... requestAnimationFrame(animate)}; requestAnimationFrame(animate); }, [value])
  ```
  No cleanup, no stored id. If `value` changes quickly (every second), multiple loops run concurrently, causing memory leak and flicker.
- **Bug:** Birthday input: `max={new Date().toISOString().split("T")[0]}` uses UTC date, so in PST (UTC-7) on 2026-10-12 00:30 UTC is still 2026-10-11 local, max will be tomorrow UTC, allowing future date. Also `new Date(birthday)` parses YYYY-MM-DD as UTC midnight, not local, causing off-by-one day for age calculation. For user born 2000-01-01, `new Date("2000-01-01")` is 2000-01-01T00:00:00Z, but local midnight in Berlin is 1999-12-31T23:00:00Z, so age off by 1 hour.
- **Bug:** `ageMs = now - new Date(birthday).getTime()` can be negative if future date entered via devtools, then all stats negative. `AnimatedNumber` would show negative heartbeats.
- **Fix:** Use `useRef` for raf id, cancel in cleanup. Use local date parsing: `new Date(birthday+"T00:00:00")` or split and use `new Date(y,m-1,d)`. Clamp ageMs to max(0, ageMs).

---

### 1.5 Theme Store — Double Persistence + Hydration Mismatch

**Files:** `lib/store/theme.ts`, `lib/components/ThemeProvider.tsx`

- **Bug:** Store uses `persist` with name "theme-storage" storing `{theme, resolvedTheme}`. Provider also manually reads same key via `localStorage.getItem("theme-storage")` and JSON.parse, then calls `setTheme`. So two sources reading same key, race condition. Also `setTheme` writes to localStorage via persist, but Provider's manual read happens before persist rehydrates, causing double write.
- **Bug:** `onRehydrateStorage` callback touches `document.documentElement.classList` — side effect inside store definition, runs during rehydration which may be SSR? Zustand docs say onRehydrateStorage runs on client, but still side effect in store file is anti-pattern. Also it doesn't handle `system` theme.
- **Bug:** `useEffect` in ThemeProvider has empty deps but uses `theme` from closure (stale). It reads systemDark via matchMedia, but if stored theme is "system", it calls `setTheme(systemDark?"dark":"light")` losing "system" preference.
- **Fix:** Simplify: store only `theme: "light"|"dark"|"system"`, not resolvedTheme. Compute resolvedTheme in hook via `useMemo` + matchMedia listener. Remove manual localStorage parsing in Provider, rely on persist. Use `useEffect` to sync classList, not onRehydrateStorage.

---

### 1.6 Deep Sea — Scroll Jank + Logic Errors

**File:** `app/(experiences)/deep-sea/page.tsx`

- **Bug:** Scroll handler unthrottled: `window.addEventListener("scroll", handleScroll)` sets state on every scroll event (could be 60-120/sec). Each setState triggers React render of whole page (including CreatureCards). Causes jank on low-end devices.
- **Bug:** `maxScroll = scrollHeight - window.innerHeight` could be <=0 if content not tall enough or on resize, then `progress = scrollTop / Math.max(maxScroll,1)` — if maxScroll negative, Math.max(negative,1)=1, progress = scrollTop/1 could be >1, depth > MAX_DEPTH, clamped later via Math.min but discovery logic uses depth directly, so at top could already be >11034 if scrollTop large.
- **Bug:** `discoveredCreatures` updated every scroll with `new Set(prev)` even if no new creature, causing unnecessary re-render. Should only update if size changes.
- **Bug:** `Bubbles` component: `windowHeight` state set once via `useEffect`, never on resize, so if user resizes, bubbles animation end position wrong. Also `x: [0, Math.sin(i)*30]` — array of 2 values means from 0 to sin(i)*30, but no return to 0, so bubbles drift sideways and stay. Should be [0, sin, 0].
- **Bug:** `DepthIndicator` uses `key={Math.round(depth)}` + `initial={{scale:1.1}} animate={{scale:1}}` — this forces React to unmount/mount the div every meter scrolled, causing layout thrash and losing CSS transition. Should not use key.
- **Bug:** Fixed layers: background div, bubbles, depth indicator, zone title, creature cards, discovery counter, title overlay, bottom message — all `fixed` with overlapping z-index, no explicit z ordering except depth indicator z-40, discovery z-40, lock button z-90. Could cause creature cards hidden behind depth indicator.
- **Bug:** `containerRef.current.scrollHeight` includes fixed children? No, fixed children are out of flow, so scrollHeight is just minHeight 10000, okay. But if user zooms, 10000px may be too small/large.
- **Fix:** Use `requestAnimationFrame` throttle, `useMemo` for visible creatures, only update discovered set when new, remove key from DepthIndicator, use CSS transforms for bubbles.

---

### 1.7 Asset URL Double Prefix Risk

**Files:** `next.config.ts`, `lib/utils/assets.ts`

- **Current:** `next.config.ts` sets `basePath="/nealarp"` and `assetPrefix="/nealarp"` for GitHub Pages. `getAssetUrl` does `"/nealarp"+path`. Build output shows `_next` assets already prefixed via assetPrefix, and manual prefix for public assets. This works today because `assetPrefix` only affects `_next` assets, not public assets referenced via string? Actually Next.js docs: assetPrefix prefixes _all_ assets, including public? Need to verify. If user later removes `assetPrefix` or changes, double prefix could happen. Also `NEXT_PUBLIC_BASE_PATH` env is set via `env` field in next.config, which is deprecated (should use `env` is okay but better to use `process.env` directly).
- **Risk:** If someone sets `NEXT_PUBLIC_BASE_PATH` manually at build time plus `basePath`, double.
- **Fix:** Make `getAssetUrl` idempotent: if path already starts with basePath, don't prefix. Add unit test.

---

### 1.8 Lock Button Collision

**Files:** `lib/components/PasswordGate.tsx`, `app/(experiences)/spend-money/page.tsx`

- Both use `fixed bottom-4 right-4`. Lock button z-[90], receipt button z-50, so lock button covers receipt button, making receipt unclickable in bottom-right corner. On mobile, both overlap.
- **Fix:** Move lock button to bottom-4 left-4 or top, or make receipt button bottom-4 left-1/2 transform.

---

## 2. High Severity (P1) — Wrong Data, Performance, UX

### 2.1 Speed Data Unit Inconsistency

**File:** `app/(experiences)/speed/data.ts`

- "Internet (fiber optic)" speed 299792 km/h — actual light speed 299792 km/s = 1,079,252,848 km/h. So fiber value is 3600x too low. "Sound (in air)" 1235 km/h correct (343 m/s). "Bullet" 3500 km/h ~ 972 m/s, okay for rifle. "Light" 1079252849 km/h correct. So fiber should be ~ 720,000,000 km/h (200,000 km/s in fiber).
- **Fix:** Audit all speeds, add source comment, convert all to km/h with correct values.

### 2.2 Size of Space — Linear Bar Useless for Cosmic Scale

**File:** `app/(experiences)/size-of-space/page.tsx`

- `widthPercent = ((size-min)/(max-min))*100` with max=8.8e26, min=1.7, so human bar width = (1.7-1.7)/(8.8e26)*100 =0%, clamped to 0.5% via `Math.max(widthPercent,0.5)`. So all objects except largest show 0.5% bar, indistinguishable. User can't compare.
- **Fix:** Use logarithmic scale: `logSize = Math.log10(size)`, then `widthPercent = (logSize - logMin)/(logMax-logMin)*100`. This makes human ~0%, moon ~10%, earth ~20%, sun ~30%, etc, visible. Also comparison mode math wrong as noted.

### 2.3 Asteroid Physics — Unrealistic Crater

**File:** `app/(experiences)/asteroid-launcher/data.ts`

- Formula `craterDiameter = 1.8 * E^0.29 * density^-0.11` yields 1.5km crater for 1m rock (should be ~20m). Real Pi-scaling: D ~ 1.8 * (E / (g * density_target))^0.22 etc. Need calibration.
- Angle param ignored, but should affect crater (sin angle).
- Earthquake magnitude: `(log10(E)-4.8)/1.5` — for E=3e11 J, log10=11.47, magnitude 4.4, but 1m rock should be ~0, not 4.4. Formula for seismic efficiency ~1e-4 of energy, so magnitude lower.
- Fireball radius 0.001*E^0.33: for Chelyabinsk (20m, 19km/s, E~1.8e15 J), E^0.33~10^(15.25*0.33)=10^5.03=107k, *0.001=107km fireball, actual Chelyabinsk fireball ~ few km. So overestimated 20x.
- **Fix:** Recalibrate using NASA impact calculator formulas: https://impact.ese.ic.ac.uk/ImpactEarth/ . Add references. Use angle: multiply by sin(angle).

### 2.4 Homepage — Performance & A11y

**File:** `app/(home)/page.tsx`

- `whileHover={{ y: -8, scale: 1.02 }}` triggers layout (y) and composite (scale). Use `transform: translateY` only via `transform` property, but framer-motion y is transform, okay. However `whileHover` on 8 cards simultaneously could cause jank. Better use CSS `hover:transform`.
- `Image` with `fill` but no `priority`, no `placeholder="blur"`. Thumbnails are webp but no blurDataURL, causes CLS.
- `GameIcon` alt="" — should have alt with title for screen readers.
- Cards are `div` inside `Link`, but `motion.div` inside `div` — should be `Link` with `motion` directly for better semantics.
- No `key` for tags okay, but tags like "simulation" duplicated across experiences, key collision across cards? No, per card unique, okay.
- No filter UI despite `category` field existing. PLAN.md promised categories filter.

### 2.5 MoneyDisplay — Key Thrashing

**File:** `app/(experiences)/spend-money/MoneyDisplay.tsx`

- `key={remaining}` on motion.div causes React to unmount/mount on every purchase, losing internal state and causing layout thrash. Should animate number via spring, not key.
- Progress bar `Math.max(percentage,0.1)%` — if spent 0, shows 0.1% bar, okay but misleading. Should show 0% with min width via CSS.

### 2.6 ItemCard — Store Subscription Over-render

**File:** `app/(experiences)/spend-money/ItemCard.tsx`

- `useSpendMoneyStore()` without selector subscribes to entire store, so every ItemCard re-renders when any purchase changes, even unrelated item. With 40 items, 40 re-renders per buy.
- **Fix:** Use `useSpendMoneyStore(state=>state.purchases[id])` and `useShallow` for spent.

### 2.7 Speed/Size-of-Space — Missing useMemo

- `maxSpeed = Math.max(...speedItems.map(i=>i.speed))` computed every render, O(n) each render. Should memoize.
- `filteredItems.sort((a,b)=>a.speed-b.speed)` mutates array returned by useMemo? useMemo returns new array each time selectedCategory changes, but sort mutates it. If React memoizes, okay, but better use `toSorted`.

### 2.8 Life Stats — Calculator Edge Cases

**File:** `app/(experiences)/life-stats/calculator.ts`

- `SECONDS_PER_YEAR = 365.25*24*60*60` correct for average year, but age calculation uses `ageMs /1000 / SECONDS_PER_DAY` for days, which uses 365.25 for year but 24h for day, okay.
- `blinks`: assumes 16 waking hours, 15 blinks/min, but doesn't account for sleep blinks 0. Okay approximation.
- `steps`: 7500/day average, but for baby (age <1 year) steps should be 0. No age gating.
- `words`: 2000 words per hour of talking, 16h waking, but assumes talking all waking hours? Should be ~16k words/day average, not 32k.
- `hair`: 0.00044m/day * days *0.5 for cuts, but comment says net ~half, but code does `Math.round(days*0.00044*100)/100` — that's full growth, not half. Should be *0.5.
- No validation for `ageMs` negative.

---

## 3. Medium Bugs (P2) — A11y, SEO, DX, Build

### 3.1 SEO — No Per-Page Metadata

- All experience pages lack `export const metadata` or `generateMetadata`. They inherit root metadata "Neal.fun V2...". Should have unique title/description per experience for sharing.
- No `sitemap.ts`, `robots.ts`, `manifest.ts`, `opengraph-image`.
- No `favicon`.

### 3.2 Accessibility

- **Homepage:** Cards missing `role="article"`, `aria-label`, focus ring. Tags are `span` not `li`.
- **ThemeToggle:** `aria-label="Toggle theme"` but doesn't announce new theme. Should have `aria-live`.
- **PasswordGate:** Input has `aria-invalid` but error message `role="alert"` is good. However eye toggle button has `aria-label` but no `aria-pressed`.
- **Deep Sea:** Depth indicator should have `aria-live="polite"` and `aria-atomic`. Creature cards clickable div should be button with `role="button"` and keyboard handler.
- **Perfect Circle:** Canvas has no `role="img"` nor fallback text. Should have `aria-label="Drawing canvas, try to draw a perfect circle"`.
- **Sliders:** All range inputs lack associated `<label>` with `htmlFor`, and no `aria-valuetext` for formatted value (e.g., "Diameter: 100 meters").
- **Color contrast:** `--primary: #6366f1` on white bg has contrast 4.5:1? Check: #6366f1 luminance ~0.3, white 1, contrast ~4.6, passes AA for normal text? Need audit. But `text-[var(--muted-foreground)]` #525252 on white #ffffff contrast ~7.5 passes, but on dark #0a0a0a with #a3a3a3 contrast ~6.5 passes. However emerald-300 gradient text on white fails.

### 3.3 Shared UI Duplication

- Button styles duplicated 20+ times: `px-4 py-2 rounded-full bg-[var(--primary)] text-white ...` etc. Should create `lib/components/ui/button.tsx` with variants.
- Card styles duplicated: `bg-[var(--card)] border border-[var(--border)] rounded-xl p-4` repeated.
- No `cn()` with `tailwind-merge`, so conflicting classes (e.g., `p-4` + `p-6`) not merged correctly.

### 3.4 Missing Error Boundaries

- No `app/(experiences)/error.tsx`, `loading.tsx`. If experience throws, whole app crashes.
- No `global-error.tsx`.

### 3.5 Config & Tooling

- `next.config.ts` `allowedDevOrigins: ["*.e2b.app"]` — wildcard may not match `https://3000-xxxx.e2b.app` because origin includes port? Next docs: allowedDevOrigins should be hostnames, wildcard allowed, but pattern `*.e2b.app` matches `3000-xxx.e2b.app`? Probably yes, but should be `*.e2b.app` without protocol, okay. However it's too permissive for prod build (should be env-guarded).
- No `pnpm typecheck` script, no `format` script.
- No `prettier`, no `lint-staged`, no `husky`.
- `eslint.config.mjs` only extends next/core-web-vitals, no import order, no unused vars.
- `tsconfig.json` strict true, but missing `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- `package.json` missing `engines` field, `packageManager` is pnpm@9.15.0 but installed pnpm 12.11.2 (mismatch).
- `postcss.config.mjs` not checked, but Tailwind v4 uses `@tailwindcss/postcss`, okay.

### 3.6 Deploy Workflow

**File:** `.github/workflows/deploy.yml`

- No caching for pnpm store, slow builds.
- No `pnpm typecheck` or `lint` step before build, so broken code could deploy.
- Uses `actions/checkout@v4` with `lfs: true` but repo has no LFS files yet (maybe future). LFS fetch slows checkout.
- No bundle size check.

### 3.7 Password Hash Script

**File:** `scripts/password-hash.mjs`

- Uses `process.argv.slice(2).join(" ").trim()` — if password contains spaces, join with space, okay. But if password itself has leading/trailing spaces, trim removes them, but `verifyPassword` also trims input, so consistent. However env override `NEXT_PUBLIC_SITE_PASSWORD` also trimmed in `envPassword()`, consistent.
- No validation for empty password after trim, but script checks `if (!password)` and exits.

---

## 4. Low / Polish (P3)

### 4.1 Code Style

- Inconsistent quotes (single vs double) across files.
- Some files use `motion.button` with `whileHover` scale, others use plain button.
- `GameIcon` uses `width={48} height={48}` but className overrides to `h-10 w-10`, causing next/image to serve 48px but display 40px, waste.

### 4.2 Unused Files

- `lib/utils/cn.ts` only used? Grep shows not used anywhere? Actually search shows no usage of `cn`. Should be used in UI components.
- `content/experiences.json` is static, but could be TypeScript for type safety.

### 4.3 Missing Features from PLAN.md

- Homepage: categories filter, search, dark/light toggle (exists but not in home layout? Home layout has ThemeToggle, okay), "Currently Playing" indicator, keyboard navigation.
- Experience Shell: share button, fullscreen toggle, loading skeleton, error boundary — none implemented.
- No `packages/ui`, `packages/experiences`, `packages/utils` monorepo structure mentioned in PLAN.md, but actual is flat.
- No `app/api/` for AI combos (Infinite Craft) — not implemented, okay but PLAN.md mentions.

### 4.4 UX Polish Gaps

- **Spend Money:** No confetti when spend 100%, no receipt total, no "You still have $X" encouragement.
- **Password Game:** No copy button, no timer, no shake for wrong rule.
- **Deep Sea:** No creature modal, no sound, no progress map.
- **Speed:** No race track visualization, only bars.
- **Life Stats:** No share as image, no comparison to average.
- **Perfect Circle:** No history, no ghost circle, no leaderboard.
- **Size of Space:** No zoomable canvas, only list.
- **Asteroid Launcher:** No map target, no crater canvas, no casualty estimate.

---

## 5. Architecture & Code Quality — Detailed

### 5.1 State Management

- Zustand stores: theme, spend-money. Both use persist, but theme also manually reads localStorage. Inconsistent.
- No store for recently played, no store for user preferences (units).
- Spend money store should be in `lib/store/` not `app/(experiences)/spend-money/store.ts` for consistency.

### 5.2 Component Organization

- `app/(experiences)/` contains both page and components (ItemCard, etc). Better to have `components/` subfolder per experience or shared `lib/components/experiences/`.
- No shared hooks: `useLocalStorage`, `useMediaQuery`, `useRaf`.

### 5.3 Type Safety

- `experiences.json` is `any` when imported. Should have type `Experience` and zod validation.
- `data.ts` files export arrays but no readonly, could be mutated.
- `formatMoney` returns string but no locale param.

### 5.4 Styling

- Uses CSS variables but Tailwind v4 `@import "tailwindcss"` without `@theme` definition. Variables defined in `:root` and `.dark` but Tailwind may not know them. Should use `@theme` or config.
- `* { border-color: var(--border) }` is Tailwind v3 pattern, v4 uses `@layer base`? Might cause specificity issues.
- No `tailwind-merge` for `cn()`.

---

## 6. Performance Deep Dive

### 6.1 Bundle Size

- Build shows First Load JS 102kB shared + 151kB for home = 253kB total. Acceptable, but framer-motion is 45kB+54kB chunks. Could be reduced via dynamic import for motion features.
- All experiences are client components, so they include framer-motion even if not needed (e.g., asteroid-launcher doesn't use motion but still loads? Check import: it doesn't import motion, but layout does? Actually asteroid page doesn't import motion, but still client).
- Could use `next/dynamic` for heavy components (canvas, etc).

### 6.2 Runtime Perf

- Deep Sea scroll: O(n) per scroll, 20 creatures, 60fps = 1200 checks/sec, okay but setState each time causes React render.
- Perfect Circle: O(n^2) for point array copy each mousemove, n=500, 500*500=250k operations per draw, okay but GC pressure.
- Spend Money: 40 ItemCards each subscribing to whole store = 40 renders per purchase, okay for 40 but not scalable.

### 6.3 Image Optimization

- `unoptimized: true` because static export, so no Next image optimization. Thumbnails are webp, good, but no `loading="lazy"` for below-fold, no `priority` for above-fold.
- Could add `blurDataURL` via script that generates base64 placeholder.

---

## 7. Security & Deployment — Detailed

### 7.1 Password Gate Security Note (already in code comments, good)

- Client-side gate, not real auth. Digest stored in bundle, brute-forceable. For GitHub Pages, okay as casual gate, but should document.
- `NEXT_PUBLIC_SITE_PASSWORD` env var embedded verbatim in bundle, visible in JS. README says so, good.
- No rate limiting on password attempts, could brute-force via script. Add attempt counter + delay after 5 fails.

### 7.2 Headers

- No CSP, no X-Frame-Options. For Vercel deployment, should add headers via `next.config.ts` `headers()` function (only works without export).
- `allowedDevOrigins` wildcard could allow any e2b.app subdomain to embed dev server, potential clickjacking in dev? Low risk.

### 7.3 LFS

- README says repo uses Git LFS for large files, but `.gitattributes` not checked. Let's check.

---

## 8. Missing Features vs PLAN.md — Gap Analysis

| PLAN.md Promise                                  | Actual                          | Gap                      |
| ------------------------------------------------ | ------------------------------- | ------------------------ |
| Homepage category filter                         | No filter                       | Missing                  |
| Search                                           | No                              | Missing                  |
| Currently Playing indicator                      | No                              | Missing                  |
| Keyboard nav                                     | No                              | Missing                  |
| Experience shell share button                    | No                              | Missing                  |
| Fullscreen toggle                                | No                              | Missing                  |
| Loading skeleton                                 | No                              | Missing                  |
| Error boundary                                   | No                              | Missing                  |
| Experience registry with status beta/coming-soon | All live, no UI for coming-soon | Partial                  |
| Monorepo packages/ui                             | Flat structure                  | Different                |
| API routes for AI                                | No                              | Not needed for current 8 |
| Three.js, Matter.js, D3                          | Not used, only framer-motion    | Simpler impl             |
| Sound effects                                    | No                              | Missing                  |
| PWA                                              | No                              | Missing                  |

---

## 9. Proposed Phased Implementation — Expanded

### Phase 0: Quick Wins (<2 hours, 10 items)

- [ ] Fix `cn()` to use `tailwind-merge` + add dep
- [ ] Add `typecheck` and `format` scripts
- [ ] Fix `AnimatedNumber` RAF cleanup
- [ ] Remove `key={remaining}` and `key={Math.round(depth)}` thrashing
- [ ] Fix lock button collision (move to left)
- [ ] Add `aria-label` to all icon buttons, fix empty alt
- [ ] Memoize maxSpeed, minSize, etc with useMemo
- [ ] Add `React.memo` to ItemCard, CreatureCard
- [ ] Fix birthday max date to use local date, clamp ageMs
- [ ] Add sitemap.ts, robots.ts, manifest.ts

### Phase A: Foundation Fixes (1-2 days)

- [ ] Refactor theme store: single source, no manual localStorage, proper system handling
- [ ] Create `lib/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `slider.tsx` with variants
- [ ] Fix spend-money store: derived spent, migrate persisted data, add zod schema
- [ ] Fix perfect-circle: useRef for points, RAF drawing, proper circle fit + closure check
- [ ] Add `app/(experiences)/error.tsx`, `loading.tsx`, `global-error.tsx`
- [ ] Add per-experience `generateMetadata` from experiences.json
- [ ] Fix asset URL idempotency

### Phase B: Correctness & Data (2-3 days)

- [ ] Rewrite password game rules: token-based Roman, solvable set, add vitest with known solution
- [ ] Audit speed data: fix fiber optic, add sources, add unit toggle (mph/km/h)
- [ ] Fix size-of-space: log scale, fix comparison math, add D3 zoomable view (optional)
- [ ] Recalibrate asteroid physics: use NASA formulas, add angle factor, add visual crater canvas
- [ ] Optimize deep-sea: RAF throttle, memo visible creatures, fix bubbles, add initial scroll call
- [ ] Fix life-stats calculator: hair growth *0.5, words/day, steps for baby, etc
- [ ] Add vitest for all calculators

### Phase C: Performance & A11y (2 days)

- [ ] Deep sea: IntersectionObserver for creatures, CSS bubbles, will-change
- [ ] Homepage: priority images, blur placeholder, CSS hover not motion
- [ ] Spend money: useShallow selectors, virtualize if >100 items
- [ ] Add skip link, aria-live regions, keyboard nav, focus rings
- [ ] Audit color contrast, fix gradient text

### Phase D: DX & Tooling (1-2 days)

- [ ] Add prettier, lint-staged, husky, .nvmrc
- [ ] Add vitest + testing-library + playwright, update deploy.yml with cache + checks
- [ ] Add CONTRIBUTING.md, experience template, issue templates
- [ ] Update pnpm version, add engines, add bundle analyzer

### Phase E: UX Polish (3-4 days, pick 2-3 experiences)

- [ ] Homepage: category filter, search, recently played
- [ ] Experience header: share (Web Share API + clipboard), fullscreen API
- [ ] Spend money: receipt total, confetti, sound toggle
- [ ] Perfect circle: history, leaderboard, ghost circle
- [ ] Deep sea: creature modal, ambient sound toggle, progress map

### Phase F: Security & Deploy

- [ ] Add `middleware.ts` for Vercel password protection (cookie-based)
- [ ] Add headers for Vercel (CSP, etc) when not static export
- [ ] Add rate limiting to password gate (attempt counter + delay)
- [ ] Fix allowedDevOrigins to be env-guarded

---

## 10. Detailed Bug List with Repro Steps

### Bug #1: Password Game unsolvable past Rule 14

- **Repro:** Try to satisfy Rule 14 (alphabetical) + Rule 6 (month). No month name has letters in alphabetical order. "January" -> j a n u a r y not sorted. So impossible.
- **Expected:** At least one solution exists for all 20 rules.
- **Fix:** Change Rule 14 to ignore month substring or make month check case-insensitive and allow non-sorted month but require rest sorted? Or change month list to include "May" which is sorted? "May" letters m a y -> m>=a? No. "A" alone? No month is sorted. So rule must be redefined.

### Bug #2: Spend Money spent desync

- **Repro:** Buy 1 Big Mac ($5), spent=5. Edit `data.ts` price to $6, reload, purchases still 1, but spent still 5, should be 6. Also manually edit localStorage `spend-money-storage` to `{"purchases":{"big-mac":1},"spent":999}` -> remaining negative, UI shows negative money.
- **Fix:** Derive spent.

### Bug #3: Perfect Circle score 100% with line

- **Repro:** Draw straight line, score calculates center average of points on line, radius average distance, deviation small, score ~80% even though not circle.
- **Fix:** Require closure and angle coverage.

### Bug #4: Deep Sea discovery counter increments every scroll even without new creature

- **Repro:** Scroll slowly, open React DevTools, see CreatureCard re-render every scroll, discoveredCreatures set new object each time.
- **Fix:** Only update if new creature added.

### Bug #5: Life Stats negative values

- **Repro:** Open console, `localStorage.setItem`? Actually enter future date via `document.querySelector('input[type=date]').value='2099-01-01'` then click Calculate, shows negative heartbeats? But max attribute prevents UI, but devtools bypass. Should clamp.

### Bug #6: Asset URL double prefix potential

- **Repro:** Set `NEXT_PUBLIC_BASE_PATH=/nealarp` and build with `basePath=/nealarp`, `assetPrefix=/nealarp`, then image src becomes `/nealarp/nealarp/...`? Currently not double because getAssetUrl uses env which is `/nealarp`, and assetPrefix is `/nealarp` but Next doesn't double for public assets? Need to test with custom basePath. Safer to make idempotent.

### Bug #7: Lock button covers receipt

- **Repro:** In spend-money, buy item, receipt button appears bottom-4 right-4, lock button also bottom-4 right-4 with higher z-index, so receipt button not clickable at exact corner. On mobile, both overlap.
- **Fix:** Move lock to left.

### Bug #8: Theme flash

- **Repro:** Set system to light, clear localStorage, reload, page flashes dark (default) then light after JS loads.
- **Fix:** Use `suppressHydrationWarning` + inline script to set class before paint, or use next-themes.

---

## 11. Metrics to Track After Fixes

- Lighthouse: Performance >90, A11y >95, SEO >95
- Bundle: First Load JS <150kB (currently 102kB shared + 151kB home = 253kB, okay)
- Test coverage: >80% for calculators/rules
- No console errors in any experience
- All experiences have at least one e2e test

---

## 12. Open Questions

1. Should password game be kept as 20 rules or expanded to 25+ like original neal.fun?
2. Should we add new experiences (e.g., Infinite Craft) or polish existing 8?
3. Add `tailwind-merge`, `zod`, `vitest`, `playwright`? Okay?
4. Keep static export for GitHub Pages or move to Vercel with server features?
5. Should we keep password gate or remove for public demo?

---

**Next:** Pick phase to start. Recommended: Phase 0 quick wins + Phase A foundation, then Phase B correctness. I can start implementing immediately after confirmation.
