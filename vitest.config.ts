import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
