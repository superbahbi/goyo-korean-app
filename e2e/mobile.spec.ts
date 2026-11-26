import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../packages/domain/src/progressStorage";
import { SCHEMA_VERSION } from "../packages/domain/src/savedState";

/**
 * The /mobile route is what the iOS shell runs. Chromium at iPhone size covers
 * its DOM, keyboard and save behaviour; WebKit itself stays in iphone.spec.ts.
 */
const iphone = devices["iPhone 15"];
test.use({
  viewport: iphone.viewport,
  userAgent: iphone.userAgent,
  deviceScaleFactor: iphone.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

async function openMobile(page: Page) {
  await page.goto("/mobile");
  await expect(page.getByTestId("goyo-mobile-root")).toBeVisible();
}

async function audit(page: Page, scope?: string) {
  await page.waitForTimeout(300);
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ]);
  if (scope) builder = builder.include(scope);
  const results = await builder.analyze();
  return results.violations.map(violation => ({
    id: violation.id,
    targets: violation.nodes.map(node => node.target.join(" ")),
  }));
}

for (const width of [320, 393]) {
  test(`the dashboard header fits a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openMobile(page);
    const settings = page.getByRole("button", { name: "Open settings" });
    await expect(settings).toBeVisible();
    const box = await settings.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`dashboard, Settings, Stats and Browse have no WCAG A/AA violations (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await openMobile(page);
    expect(await audit(page)).toEqual([]);

    const sheet = '[data-testid="goyo-mobile-modal"]';
    await page.getByRole("button", { name: "Open settings" }).click();
    await expect(page.locator(sheet)).toBeVisible();
    expect(await audit(page, sheet)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByTestId("open-stats").click();
    await expect(page.locator(sheet)).toBeVisible();
    expect(await audit(page, sheet)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByTestId("browse-deck").click();
    await expect(page.locator(sheet)).toBeVisible();
    expect(await audit(page, sheet)).toEqual([]);
  });
}

// Five survival cards reviewed yesterday, so Listening opens with real
// questions instead of its "study a few cards first" notice.
function reviewedLearner() {
  const day = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  };
  const ids = ["surv_001", "surv_002", "surv_003", "surv_004", "surv_005"];
  return {
    schemaVersion: SCHEMA_VERSION,
    cardStates: Object.fromEntries(
      ids.map(id => [
        id,
        {
          id,
          due: day(1),
          interval: 3,
          timesReviewed: 2,
          timesCorrect: 2,
          lastReviewDate: day(-1),
          easeFactor: 2.5,
          consecutiveCorrect: 1,
          lapseCount: 0,
        },
      ])
    ),
    settings: { dailyGoal: 10, newCardsPerDay: 3, autoPlayAudio: false },
  };
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`practice sheets have no WCAG A/AA violations (${colorScheme})`, async ({
    page,
  }) => {
    await page.addInitScript(
      ([key, state]) => window.localStorage.setItem(key, JSON.stringify(state)),
      [PROGRESS_STORAGE_KEY, reviewedLearner()] as const
    );
    await page.emulateMedia({ colorScheme });
    await openMobile(page);
    const sheet = '[data-testid="goyo-mobile-modal"]';

    await page.getByTestId("practice-hangul").click();
    await page.locator(sheet).getByRole("button", { name: /^ㄷ/ }).click();
    await expect(
      page.getByRole("img", { name: /Stroke order for ㄷ/ })
    ).toBeVisible();
    expect(await audit(page, sheet)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByTestId("practice-grammar").click();
    await page.locator(sheet).getByRole("button", { name: /^1\. / }).click();
    await page
      .locator(sheet)
      .getByText(/^Quiz · 1\//)
      .waitFor();
    // Answer the first question so the verdict colours are on screen.
    const options = page.locator(`${sheet} button:not([aria-label])`);
    await options.last().click();
    await expect(
      page.locator(sheet).getByText(/^(Correct\.|Not quite\.)/)
    ).toBeVisible();
    expect(await audit(page, sheet)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByTestId("practice-listening").click();
    await expect(page.locator(sheet)).toBeVisible();
    expect(await audit(page, sheet)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.getByTestId("practice-shadowing").click();
    await expect(page.locator(sheet)).toBeVisible();
    expect(await audit(page, sheet)).toEqual([]);
  });
}

test("the Settings sheet keeps focus, closes on Escape and hands focus back", async ({
  page,
}) => {
  await openMobile(page);
  const opener = page.getByRole("button", { name: "Open settings" });
  await opener.click();
  const sheet = page.getByTestId("goyo-mobile-modal");
  await expect(sheet).toBeVisible();

  // Tabbing well past the last control never leaves the sheet.
  for (let press = 0; press < 40; press += 1) await page.keyboard.press("Tab");
  expect(
    await sheet.evaluate(node => node.contains(document.activeElement))
  ).toBe(true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden"
  );

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("a grade made in a web tab appears in /mobile without a reload", async ({
  page,
  context,
}) => {
  await openMobile(page);
  await expect(page.getByText(/^⚡ 0 XP$/)).toBeVisible();

  const web = await context.newPage();
  await web.setViewportSize({ width: 1280, height: 900 });
  await web.goto("/");
  await web
    .getByRole("button", { name: /start (daily|first) session/i })
    .click();
  await web.keyboard.press("Enter");
  await web.keyboard.press("Space");
  await web.keyboard.press("2");

  // The storage event reaches /mobile, which adopts the save as is.
  await expect(page.getByText(/^⚡ [1-9]\d* XP$/)).toBeVisible();
});
