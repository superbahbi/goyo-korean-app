// Captures the app's main screens so a UI change can be inspected without
// opening a browser. Every capture starts from a fresh learner and resets the
// theme, so the output is deterministic.
//
//   pnpm shots                                      # build, serve, capture
//   SHOTS_LABEL=before pnpm shots                   # keep a baseline
//   SHOTS_BASE_URL=http://127.0.0.1:3000 pnpm shots # reuse a running server
//
// Images land in `.tmp/shots/<label>/`. Read them with the read tool; do not
// use a preview tool for a self-check.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, devices, type Page } from "@playwright/test";
import { build, preview } from "vite";

const PORT = Number(process.env.SHOTS_PORT ?? 4173);
const BASE_URL = process.env.SHOTS_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const LABEL = process.env.SHOTS_LABEL ?? "current";
const OUT_DIR = path.join(".tmp", "shots", LABEL);
const THEMES = ["light", "dark"] as const;

// An iPhone-sized Chromium viewport is enough for layout review; WebKit
// behaviour stays in e2e/iphone.spec.ts.
const { defaultBrowserType: _browser, ...iphone } = devices["iPhone 15"];
const VIEWPORTS = [
  { name: "desktop", options: { viewport: { width: 1280, height: 900 } } },
  { name: "iphone", options: iphone },
] as const;

interface Screen {
  name: string;
  /** Interactions that bring the screen into view. */
  open: (page: Page) => Promise<void>;
  /** Capture only at desktop width. */
  desktopOnly?: boolean;
  /** Capture the whole page, not just the viewport. */
  fullPage?: boolean;
}

async function revealPracticeTiles(page: Page) {
  const toggle = page.getByRole("button", { name: /show all \d+/i });
  if ((await toggle.count()) > 0) await toggle.click();
}

async function openBrowse(page: Page) {
  await page.getByRole("button", { name: "Browse Deck" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.getByLabel("Search vocabulary library").fill("안녕하세요");
  await dialog.getByText("Hello (polite/formal)").waitFor();
}

const SCREENS: Screen[] = [
  { name: "dashboard", open: revealPracticeTiles, fullPage: true },
  { name: "browse", open: openBrowse },
  {
    name: "browse-romanized",
    desktopOnly: true,
    open: async page => {
      await openBrowse(page);
      const row = page.getByTestId("browse-result-row").first();
      await row.getByRole("button", { name: /show romanization/i }).click();
      await row.getByRole("button", { name: /hide romanization/i }).waitFor();
    },
  },
  {
    name: "browse-playing",
    desktopOnly: true,
    open: async page => {
      await openBrowse(page);
      const row = page.getByTestId("browse-result-row").first();
      await row.getByRole("button", { name: /speak pronunciation/i }).click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="browse-result-row"]')
            ?.getAttribute("aria-busy") === "true"
      );
    },
  },
  {
    name: "hangul",
    open: async page => {
      await revealPracticeTiles(page);
      await page.getByRole("button", { name: /learn hangul/i }).click();
      await page.getByRole("dialog").waitFor();
    },
  },
  {
    name: "study",
    open: async page => {
      await page
        .getByRole("button", { name: /start (daily|first) session/i })
        .click();
      await page.getByRole("dialog").waitFor();
    },
  },
  {
    name: "stats",
    open: async page => {
      await page.getByRole("button", { name: "Full Stats" }).click();
      await page.getByRole("dialog").waitFor();
    },
  },
  {
    name: "grammar",
    open: async page => {
      await revealPracticeTiles(page);
      await page.getByRole("button", { name: /grammar lessons/i }).click();
      await page.getByRole("dialog").waitFor();
    },
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const ownServer = !process.env.SHOTS_BASE_URL;
  let server: Awaited<ReturnType<typeof preview>> | null = null;
  if (ownServer) {
    console.log("Building the app...");
    await build({ logLevel: "warn" });
    server = await preview({
      preview: { host: "127.0.0.1", port: PORT, strictPort: true },
    });
  }

  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}
  );
  let failures = 0;

  try {
    for (const viewport of VIEWPORTS) {
      for (const theme of THEMES) {
        const context = await browser.newContext({
          ...viewport.options,
          colorScheme: theme,
        });
        await context.addInitScript(
          ({ theme }) => {
            window.localStorage.clear();
            window.localStorage.setItem("goyo-theme", theme);
          },
          { theme }
        );

        for (const screen of SCREENS) {
          if (screen.desktopOnly && viewport.name !== "desktop") continue;
          const page = await context.newPage();
          try {
            await page.goto(BASE_URL);
            await page
              .getByRole("button", { name: /start (daily|first) session/i })
              .waitFor();
            await screen.open(page);
            // Let Radix and Framer Motion finish their enter transition.
            await page.waitForTimeout(350);
            const file = path.join(
              OUT_DIR,
              `${screen.name}-${theme}-${viewport.name}.png`
            );
            await page.screenshot({ path: file, fullPage: screen.fullPage });
            console.log(`captured ${file}`);
          } catch (error) {
            failures += 1;
            console.error(
              `failed ${screen.name}-${theme}-${viewport.name}:`,
              error
            );
          } finally {
            await page.close();
          }
        }

        await context.close();
      }
    }
  } finally {
    await browser.close();
    await server?.close();
  }

  if (failures > 0) process.exitCode = 1;
}

await main();
