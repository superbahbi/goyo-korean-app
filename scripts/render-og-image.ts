// Renders public/og-image.png, the 1200×630 card that link previews show for
// goyo.bahbi.net (Open Graph and Twitter Card tags in apps/web/index.html).
// The card is plain HTML drawn by Playwright's Chromium, so a copy or brand
// change is one re-run:
//
//   pnpm exec tsx scripts/render-og-image.ts
//
// The Hangul on the card comes from the app icon, which is an image, so the
// machine that renders it needs no Korean font.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICON_PATH = path.join(ROOT, "public", "icons", "icon-512.png");
const OUT_PATH = path.join(ROOT, "public", "og-image.png");

const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** The card markup; the icon is inlined so the page loads nothing else. */
function renderOgCardHtml(iconDataUrl: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; }
      body {
        width: ${OG_IMAGE_SIZE.width}px;
        height: ${OG_IMAGE_SIZE.height}px;
        display: flex;
        align-items: center;
        gap: 72px;
        padding: 0 96px;
        font-family: "DejaVu Sans", "Helvetica Neue", Arial, sans-serif;
        color: #0f172a;
        background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 55%, #d1fae5 100%);
      }
      .icon {
        flex: none;
        width: 300px;
        height: 300px;
        border-radius: 72px;
        box-shadow: 0 24px 60px rgba(4, 120, 87, 0.28);
      }
      .eyebrow {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #047857;
      }
      h1 { margin-top: 12px; font-size: 112px; line-height: 1; }
      .lede { margin-top: 24px; font-size: 40px; line-height: 1.25; color: #1e293b; }
      .facts { margin-top: 28px; font-size: 28px; color: #475569; }
    </style>
  </head>
  <body>
    <img class="icon" src="${iconDataUrl}" alt="" />
    <div>
      <p class="eyebrow">Korean practice</p>
      <h1>Goyo</h1>
      <p class="lede">Learn Korean words by ear, with spaced repetition.</p>
      <p class="facts">Free · Works offline · No account</p>
    </div>
  </body>
</html>`;
}

async function main(): Promise<void> {
  const icon = await readFile(ICON_PATH);
  const html = renderOgCardHtml(
    `data:image/png;base64,${icon.toString("base64")}`
  );
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: OG_IMAGE_SIZE,
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "load" });
    await page.screenshot({ path: OUT_PATH, type: "png" });
  } finally {
    await browser.close();
  }
  console.log(`wrote ${path.relative(ROOT, OUT_PATH)}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
