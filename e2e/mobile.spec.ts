import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type Page } from "@playwright/test";

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
