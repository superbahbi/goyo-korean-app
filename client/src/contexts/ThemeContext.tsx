import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "goyo-theme";

interface ThemeContextType {
  /** The user's choice: light, dark, or follow the OS. */
  theme: Theme;
  /** The theme actually painted right now. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const darkQuery = "(prefers-color-scheme: dark)";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(darkQuery).matches;
}

function readStoredTheme(fallback: Theme): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); fall back.
  }
  return fallback;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (meta) {
    meta.content = resolved === "dark" ? "#111a18" : "#f8fafc";
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    switchable ? readStoredTheme(defaultTheme) : defaultTheme
  );
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  // Track the OS preference so "system" follows it live.
  useEffect(() => {
    const media = window.matchMedia(darkQuery);
    const onChange = (event: MediaQueryListEvent) =>
      setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    if (!switchable) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persisting is best effort; the in-memory choice still applies.
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme, switchable }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
