import { expect, test } from "@playwright/test";

test("reloads the shell and serves precached audio offline", async ({
  page,
  context,
}) => {
  await page.goto("/");

  // The production build registers the worker on load. Wait for it to finish
  // precaching, then reload once: a worker only controls pages loaded after it
  // activates, and the offline reload must be served by it.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect(
    page.getByText("Ready to practice?", { exact: true })
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller))
    )
    .toBe(true);

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(
      page.getByText("Ready to practice?", { exact: true })
    ).toBeVisible();

    // The audio map and the Hangul clips are precached, so both must resolve
    // with no network at all. Retry briefly in case the restarted worker needs
    // a moment to answer its first request.
    for (const url of ["/audio/index.json", "/audio/elevenlabs_cons_001.mp3"]) {
      await expect
        .poll(
          () =>
            page.evaluate(
              path =>
                fetch(path).then(
                  response => response.ok,
                  () => false
                ),
              url
            ),
          { message: `${url} should be served from the precache` }
        )
        .toBe(true);
    }
  } finally {
    await context.setOffline(false);
  }
});
