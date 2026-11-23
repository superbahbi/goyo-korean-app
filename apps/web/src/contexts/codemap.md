# apps/web/src/contexts/

## Responsibility

Cross-cutting React contexts. Today this folder holds exactly one: the theme
context that owns the learner's light/dark/system choice, resolves it against
the OS preference, and applies it to the document.

## Design

`ThemeContext.tsx` — Context + Provider/hook pair:

- Named exports: `Theme` (`"light" | "dark" | "system"`), `ResolvedTheme`
  (`"light" | "dark"`), `THEME_STORAGE_KEY = "goyo-theme"`, `ThemeProvider`,
  `useTheme`.
- Two distinct values are modelled: **theme** = the persisted user choice, and
  **resolvedTheme** = what is actually painted. `"system"` resolves live from a
  `matchMedia("(prefers-color-scheme: dark)")` listener held in `systemDark`
  state.
- `switchable` prop (default `true`) gates persistence: when `false`,
  `defaultTheme` is used verbatim and `setTheme` never writes localStorage.
- `useTheme()` throws `"useTheme must be used within ThemeProvider"` when used
  outside the provider, so a missing provider fails fast instead of rendering
  an unthemed tree.
- Module-private helpers: `systemPrefersDark()` (SSR-safe), `readStoredTheme(
fallback)` (validates stored value, swallows blocked-storage errors), and
  `applyTheme(resolved)` which toggles `html.dark`, sets
  `documentElement.style.colorScheme`, and updates the `theme-color` meta
  (`#111a18` dark / `#f8fafc` light).
- Initial state is lazy (`useState(() => readStoredTheme(defaultTheme))`) so the
  first paint already matches the save; no blank-theme frame.

## Flow

1. Mount → initial `theme` from localStorage (or `defaultTheme`), initial
   `systemDark` from `matchMedia`.
2. Derive `resolvedTheme`: `theme === "system" ? (systemDark ? "dark" : "light")
: theme`.
3. Effect on `resolvedTheme` → `applyTheme(...)` mutates document class,
   `colorScheme`, and meta tag.
4. `setTheme(next)` updates state and writes `goyo-theme`; `toggleTheme()`
   flips between resolved `light`/`dark` (never back to `"system"`).
5. OS change events update `systemDark`, re-resolving `"system"` without a
   remount.

## Integration

- Consumed by `../App.tsx` (`<ThemeProvider defaultTheme="system" switchable>`
  wrapping the router) and by any component toggling appearance via `useTheme`.
- The storage key and meta-color values are duplicated by the inline
  bootstrapping script in `../../index.html`; changing one requires changing
  the other.
- Visual tokens it activates live in `../index.css` (`:root` vs `.dark`).
