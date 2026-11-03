import { expect, test, type Locator } from "@playwright/test";

// Blocking the worker keeps the clip request visible to Playwright. The app
// falls back to plain HTTP when registration is unavailable, which is all this
// smoke needs.
test.use({ serviceWorkers: "block" });

async function box(locator: Locator) {
  const value = await locator.boundingBox();
  expect(value, "a result row should have a box").not.toBeNull();
  return value!;
}

/** The list must not move when a row changes a label or starts playing. */
function expectSameBox(
  actual: { y: number; height: number },
  expected: { y: number; height: number }
) {
  expect(Math.abs(actual.y - expected.y)).toBeLessThan(1);
  expect(Math.abs(actual.height - expected.height)).toBeLessThan(1);
}

test("searches the library and plays a pronunciation clip", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Browse Deck" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Vocabulary library");

  await page.getByLabel("Search vocabulary library").fill("안녕하세요");
  await expect(dialog.getByText("안녕하세요", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Hello (polite/formal)")).toBeVisible();

  const audioRequest = page.waitForRequest(
    request =>
      request.url().includes("/audio/") && request.url().endsWith(".mp3")
  );
  await page
    .getByRole("button", { name: "Speak pronunciation for 안녕하세요" })
    .click();

  // The first curated card is the one the search filtered down to, so the clip
  // requested must be its vocabulary audio rather than a Hangul or number file.
  expect((await audioRequest).url()).toMatch(
    /elevenlabs_surv_001\.[0-9a-f]{8}\.mp3$/
  );
});

test("revealing romanization and playing audio keep the list still", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Browse Deck" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Vocabulary library");

  const rows = dialog.getByTestId("browse-result-row");
  await expect(rows.nth(1)).toBeVisible();
  // Let the dialog's enter transition finish before taking the baseline.
  await page.waitForTimeout(300);

  const first = rows.nth(0);
  const second = rows.nth(1);
  const firstBefore = await box(first);
  const secondBefore = await box(second);

  // The romanization slot is reserved, so revealing it must not add a row or
  // push the next card down.
  await first.getByRole("button", { name: /show romanization for/i }).click();
  await expect(
    first.getByRole("button", { name: /hide romanization for/i })
  ).toBeVisible();
  expectSameBox(await box(first), firstBefore);
  expectSameBox(await box(second), secondBefore);

  // The playing label swaps inside a fixed-width box, so the row and every
  // row below it must stay put.
  await first.getByRole("button", { name: /speak pronunciation for/i }).click();
  await expect(first).toHaveAttribute("aria-busy", "true");
  expectSameBox(await box(first), firstBefore);
  expectSameBox(await box(second), secondBefore);

  // And the resting state after playback is the same size again.
  await expect(first).toHaveAttribute("aria-busy", "false", {
    timeout: 15_000,
  });
  expectSameBox(await box(first), firstBefore);
  expectSameBox(await box(second), secondBefore);
});
