import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Compile JSX the way the app build does (@vitejs/plugin-react's automatic
  // runtime), so a component test needs no `import React`.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "apps", "web", "src"),
      "@domain": path.resolve(import.meta.dirname, "packages", "domain", "src"),
      "@shared": path.resolve(import.meta.dirname, "packages", "shared"),
    },
  },
  test: {
    include: [
      "scripts/**/*.test.ts",
      "apps/web/**/*.test.ts",
      "packages/domain/**/*.test.ts",
      "packages/shared/**/*.test.ts",
      "mobile/**/*.test.ts",
    ],
  },
});
