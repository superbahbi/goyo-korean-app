# apps/web/

## Responsibility

Vite web-client root: the single static HTML document that boots the React 19
SPA plus the entire client source tree. It holds no build logic — bundling,
aliasing, and the PWA worker config live in the repo-root `vite.config.ts`.

This is the web app workspace package. Vercel builds it from the repo root
(`vercel.json` points at the root `pnpm build` and `dist/public`), so moving
it here needs no Vercel dashboard change.

## Design

- Single-page document (`index.html`) with one mount node (`#root`) and one
  module entry (`/src/main.tsx`); routing is client-side (wouter), so there is
  no per-route HTML.
- **Pre-paint theme bootstrap**: `/theme-init.js` (`public/theme-init.js`, an
  external script so the strict `script-src 'self'` CSP allows it) reads the
  `goyo-theme` localStorage key and `prefers-color-scheme`, then toggles
  `html.dark`, sets `colorScheme`, and rewrites the `theme-color` meta before
  first paint. It is a deliberate duplicate of `THEME_STORAGE_KEY` /
  `applyTheme` in `src/contexts/ThemeContext.tsx` — both must stay in sync to
  avoid a light-flash for dark-mode learners.
- Installable-PWA meta contract: `mobile-web-app-capable`,
  `apple-mobile-web-app-capable`, `apple-mobile-web-app-title` ("Goyo"),
  `apple-mobile-web-app-status-bar-style`, `viewport-fit=cover`, and
  `theme-color` for light (`#f8fafc`) / dark (`#111a18`).
- Icons resolve to `public/icons/icon-192.png` for both favicon and
  apple-touch-icon; the web app manifest and service worker come from the
  Workbox plugin in `vite.config.ts`.
- Search and link-preview metadata: `description`, a canonical link to
  `https://goyo.bahbi.net/`, Open Graph and Twitter Card tags pointing at
  `public/og-image.png` (1200×630, rendered by `scripts/render-og-image.ts`).
  `public/robots.txt` and `public/sitemap.xml` name the same domain.

## Flow

1. Browser requests `/` → server returns `index.html`.
2. `/theme-init.js` resolves dark/light and paints the correct document class
   before React exists (no FOUC).
3. `#root` is populated by `/src/main.tsx`, which mounts `App`; from then on
   every screen, dialog, and theme change is React/CSS-variable driven.
4. No data enters or leaves at this layer.

## Integration

- Downward: loads `/src/main.tsx`; resolves `/icons/*` and Workbox assets from
  `public/`.
- Upward: built by the root `vite.config.ts` (`@` → `apps/web/src` alias,
  `registerType: "prompt"`, manifest, audio manifest read from
  `public/audio/index.json`).
- Sister documentation: `src/codemap.md` for routing/wiring and
  `src/contexts/codemap.md` for the theme contract this document bootstraps.
