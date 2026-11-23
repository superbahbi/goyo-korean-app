import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "packages", "shared"),
    },
  },
  test: {
    include: [
      "scripts/**/*.test.ts",
      "client/src/**/*.test.ts",
      "packages/shared/**/*.test.ts",
      "mobile/**/*.test.ts",
    ],
  },
});
