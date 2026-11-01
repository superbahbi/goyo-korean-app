import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";

const OPTIONS: Array<{
  value: Theme;
  label: string;
  Icon: typeof Sun;
}> = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div id="theme-label" className="text-sm font-medium text-foreground/80">
        Appearance
      </div>
      <div
        role="radiogroup"
        aria-labelledby="theme-label"
        className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/60 p-1"
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(value)}
              className={cn(
                "flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        System follows your device's light or dark setting. Your choice is saved
        on this device.
      </p>
    </div>
  );
}
