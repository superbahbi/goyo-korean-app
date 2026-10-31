import { expect, test } from "@playwright/test";

// Blocking the worker keeps the clip request visible to Playwright. The app
// falls back to plain HTTP when registration is unavailable, which is all this
// smoke needs.
test.use({ serviceWorkers: "block" });

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
    .getByRole("button", { name: "Play pronunciation for 안녕하세요" })
    .click();

  // The first curated card is the one the search filtered down to, so the clip
  // requested must be its vocabulary audio rather than a Hangul or number file.
  expect((await audioRequest).url()).toMatch(
    /elevenlabs_surv_001\.[0-9a-f]{8}\.mp3$/
  );
});
