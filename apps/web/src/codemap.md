# apps/web/src/

## Responsibility

Application composition root: mounts React, installs the global provider stack,
defines the route table, registers the service worker, and declares the
semantic design-token theme consumed by every component in the tree.

## Design

**`main.tsx`** — bootstrap edge:

- `createRoot(document.getElementById("root")!)` under `StrictMode`.
- `registerSW({ immediate: true })` from `virtual:pwa-register`. Because the
  build uses `registerType: "prompt"`, `onNeedRefresh` raises a persistent
  sonner toast (`id: "pwa-update"`, `duration: Infinity`) whose Reload action
  calls `updateSW(true)`. Progress survives the reload (localStorage).

**`App.tsx`** — provider + routing shell:

- Provider order: `ErrorBoundary` → `ThemeProvider defaultTheme="system"
switchable` → `Toaster` + `Router`. There is no `MotionConfig` or
  `TooltipProvider`; animation is CSS and honours `prefers-reduced-motion`
  in `index.css`.
- `Router` is a wouter `<Switch>`: `/` → `Home`, `/mobile` → lazily imported
  `../../mobile/App` inside `Suspense fallback={null}`, `/404` → `NotFound`,
  and a catch-all `<Route component={NotFound} />`.
- `Analytics` and `SpeedInsights` are `React.lazy` imports, so they load after
  the app paints and stay out of the first-load bundle. They sit **outside**
  the error boundary, inside an `AnalyticsBoundary` that renders `null` when
  the chunk fails (offline, blocked), so a failing analytics script cannot
  take down study. They are skipped entirely in the `goyo://` iOS shell.

**`index.css`** — Tailwind 4 token theme:

- `@import "tailwindcss"` + `tw-animate-css`; `@custom-variant dark
(&:is(.dark *))` makes dark a class-scoped variant.
- `@theme inline` maps semantic CSS variables (`--background`, `--primary`,
  `--card`, `--muted`, `--ring`, sidebar/chart tokens, radii) onto Tailwind
  utilities such as `bg-card` / `text-muted-foreground`.
- `:root` holds the light oklch palette; `.dark` overrides it with a
  jade-tinted charcoal palette. Components stay theme-agnostic.
- `@layer base` applies border/outline defaults, sets
  `background-color: var(--background)` on `html` to kill overscroll flash, and
  grants `cursor-pointer` to interactive elements.
- `.container` overrides Tailwind's container (centered, responsive 16/24/32px
  padding, 1280px max).
- `@keyframes goyo-audio-card-glow` + `.audio-card-playing` provide the
  now-playing card glow, disabled under `prefers-reduced-motion`; a global
  reduced-motion block also neutralizes animations/transitions/scroll.

## Flow

`index.html` → `main.tsx` (root render + SW update prompt) → `App` providers →
`Router` matches the location → page module. Theme choice flows
`ThemeProvider` → `html.dark` class → CSS variables → utility classes; no
component reads the theme directly for styling.

## Integration

- Imports: `./components` (ErrorBoundary, `ui/sonner`),
  `./contexts/ThemeContext`, `./pages/Home`, `./pages/NotFound`, `../../mobile/App`,
  plus `wouter`, `@vercel/analytics/react` and
  `@vercel/speed-insights/react` (both lazy, behind a null-rendering error
  boundary), `sonner`, `virtual:pwa-register`.
- Consumers: `apps/web/index.html` (entry + pre-paint theme script) and every
  module under `components/`, `hooks/`, `pages/`, `contexts/`.
