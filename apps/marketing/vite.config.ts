import { DARK_THEME, LIGHT_THEME } from "@goyo/shared/theme";
import { defineConfig } from "vite";

const themeVariables = (theme: typeof LIGHT_THEME) =>
  Object.entries(theme)
    .map(([name, color]) => `--${name}:${color}`)
    .join(";");

export default defineConfig({
  build: { assetsInlineLimit: 0 },
  plugins: [
    {
      name: "goyo-theme",
      transformIndexHtml() {
        return [
          {
            tag: "style",
            children: `
              :root { color-scheme: light; ${themeVariables(LIGHT_THEME)} }
              @media (prefers-color-scheme: dark) {
                :root { color-scheme: dark; ${themeVariables(DARK_THEME)} }
              }
            `,
          },
        ];
      },
    },
  ],
});
