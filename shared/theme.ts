/**
 * Cross-platform theme tokens.
 *
 * The web app expresses these colours as CSS variables; React Native cannot
 * read CSS, so the same values live here as plain strings and both platforms
 * consume one palette. The emerald is Goyo's brand (`#059669` / `#10b981`),
 * neutrals follow Tailwind's slate scale, and `brandSoft` is the pale emerald
 * wash used for selected and informational surfaces (`#ecfdf5`).
 */

export type ThemePreference = "system" | "light" | "dark";

/**
 * localStorage key the theme choice is persisted under, shared by the web
 * client's ThemeContext and the mobile app's provider so one device keeps one
 * choice across both surfaces. The web app may store "system" here; readers
 * that only model an explicit light/dark choice treat it as a fallback.
 */
export const THEME_STORAGE_KEY = "goyo-theme";

export interface ThemeColors {
  /** Screen background. */
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  /** Primary brand emerald. */
  brand: string;
  /** Darker emerald for pressed states and text on a soft wash. */
  brandStrong: string;
  /** Pale emerald surface for selections and callouts. */
  brandSoft: string;
  /** Shadow/overlay base; apply opacity at the call site. */
  shadow: string;
}

export const LIGHT_THEME: ThemeColors = {
  background: "#f8fafc",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  popover: "#ffffff",
  popoverForeground: "#0f172a",
  primary: "#059669",
  primaryForeground: "#ffffff",
  secondary: "#f1f5f9",
  secondaryForeground: "#0f172a",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  accent: "#ecfdf5",
  accentForeground: "#065f46",
  destructive: "#dc2626",
  destructiveForeground: "#ffffff",
  border: "#e2e8f0",
  input: "#e2e8f0",
  ring: "#10b981",
  success: "#059669",
  successForeground: "#ffffff",
  warning: "#d97706",
  warningForeground: "#ffffff",
  brand: "#059669",
  brandStrong: "#047857",
  brandSoft: "#ecfdf5",
  shadow: "#0f172a",
};

export const DARK_THEME: ThemeColors = {
  background: "#0f172a",
  foreground: "#f1f5f9",
  card: "#1e293b",
  cardForeground: "#f1f5f9",
  popover: "#1e293b",
  popoverForeground: "#f1f5f9",
  primary: "#10b981",
  primaryForeground: "#022c22",
  secondary: "#334155",
  secondaryForeground: "#f1f5f9",
  muted: "#334155",
  mutedForeground: "#94a3b8",
  accent: "#064e3b",
  accentForeground: "#d1fae5",
  destructive: "#f87171",
  destructiveForeground: "#450a0a",
  border: "#334155",
  input: "#334155",
  ring: "#10b981",
  success: "#10b981",
  successForeground: "#022c22",
  warning: "#fbbf24",
  warningForeground: "#422006",
  brand: "#10b981",
  brandStrong: "#34d399",
  brandSoft: "#064e3b",
  shadow: "#000000",
};

/** Pick the palette for a resolved light/dark mode. */
export function getThemeColors(mode: "light" | "dark"): ThemeColors {
  return mode === "dark" ? DARK_THEME : LIGHT_THEME;
}
