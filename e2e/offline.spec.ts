import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Clips are content-hashed, so read the name the app itself will use.
const index = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "public", "audio", "index.json"),
    "utf8"
  )
) as { alphabet: { consonants: Record<string, string> } };
const hangulClip = index.alphabet.consonants.cons_001;

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
  // A fresh learner gets the first-run start block instead of the welcome
  // hero, so wait on the session action, which exists in both states.
  await expect(
    page.getByRole("button", { name: /start (daily|first) session/i })
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
      page.getByRole("button", { name: /start (daily|first) session/i })
    ).toBeVisible();

    // The audio map and the Hangul clips are precached, so both must resolve
    // with no network at all. Retry briefly in case the restarted worker needs
    // a moment to answer its first request.
    for (const url of ["/audio/index.json", `/audio/${hangulClip}`]) {
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
