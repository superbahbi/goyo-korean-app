import { defineConfig, devices } from "@playwright/test";

// The smokes run against the production build, not the dev server, because the
// service worker and the precache only exist there (the offline reload checks
// depend on them).
const PORT = 4173;
const baseURL = `http://127.0.0.1:${PORT}`;

// CI installs the bundled Chromium. Locally, an installed Chrome can stand in
// for it with `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e`.
const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    ...(channel ? { channel } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm exec vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: baseURL,
    // Always rebuild and restart: reusing a server that is already listening
    // silently skips the build, so the suite could test an old bundle.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
