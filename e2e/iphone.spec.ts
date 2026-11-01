import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Runs only in the webkit-iphone project: WebKit is the engine behind every
// iPhone browser and installed iOS web app, so these checks cover what Chromium
// cannot: gesture-gated audio, the iOS Home Screen meta tags and WebKit's
// service worker and offline behaviour.

const PROGRESS_KEY = "goyo-progress-v2";
const INSTALL_HINT_KEY = "goyo-ios-install-hint";

function dayKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// Five reviewed cards due tomorrow, so the daily session is three fresh cards.
// The clips are real, so a played card proves the audio path end to end.
function seedProgress(autoPlayAudio: boolean) {
  const cardIds = ["surv_001", "surv_002", "surv_003", "surv_004", "surv_005"];
  return {
    schemaVersion: 4,
    cardStates: Object.fromEntries(
      cardIds.map(id => [
        id,
        {
          id,
          due: dayKey(1),
          interval: 3,
          timesReviewed: 2,
          timesCorrect: 2,
          lastReviewDate: dayKey(-1),
          easeFactor: 2.5,
          consecutiveCorrect: 1,
          lapseCount: 0,
          lastResponseTimeMs: 2400,
        },
      ])
    ),
    stats: {
      totalXp: 120,
      level: 2,
      streak: 3,
      lastStudyDate: dayKey(),
      highestStreak: 3,
      totalCardsLearned: cardIds.length,
    },
    settings: {
      dailyGoal: 10,
      newCardsPerDay: 3,
      autoPlayAudio,
      audioSpeaker: "elevenlabs",
    },
    reviewLog: { schemaVersion: 1, entries: [] },
    studyDays: {},
  };
}

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", error => errors.push(error.message));
  return errors;
}

// A fresh save hides the dashboard hero and shows the first-session block
// instead, so wait on the session action, which exists in both states.
async function waitForDashboard(page: Page) {
  await expect(
    page.getByRole("button", { name: /start (daily|first) session/i })
  ).toBeVisible();
}

async function startSession(page: Page) {
  await page
    .getByRole("button", { name: /start (daily|first) session/i })
    .click();
}

async function gradeOneCard(page: Page) {
  // The first card is new, so Enter clears its introduction before the reveal.
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(page.getByText("How did that feel?")).toBeVisible();
  await page.keyboard.press("2");
}

test.describe("first-tap audio", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([key, state]) => window.localStorage.setItem(key, JSON.stringify(state)),
      [PROGRESS_KEY, seedProgress(true)] as const
    );
    await page.goto("/");
  });

  test("the speaker tap requests a clip with no audio console error", async ({
    page,
  }) => {
    await waitForDashboard(page);
    const errors = trackConsoleErrors(page);

    const clips: string[] = [];
    page.on("request", request => {
      if (/\/audio\/.+\.mp3(\?|$)/.test(request.url()))
        clips.push(request.url());
    });

    await startSession(page);
    const speaker = page
      .getByRole("button", { name: /hear it again for/i })
      .first();
    await expect(speaker).toBeVisible();
    // Auto-play fires about 300 ms after the card mounts. Let it pass, then
    // count only the clip the tap requests.
    await page.waitForTimeout(1000);
    clips.length = 0;

    // A real tap is the user gesture iOS requires before an element may play
    // sound.
    await speaker.tap();
    await expect.poll(() => clips.length).toBeGreaterThan(0);
    expect(clips[0]).toMatch(/\/audio\/.+\.mp3/);

    // Give the clip time to resolve and report any failure it would log.
    await page.waitForTimeout(1000);
    expect(errors.filter(message => /audio/i.test(message))).toEqual([]);
  });
});

test.describe("iOS install path", () => {
  test("exposes the iOS Home Screen meta tags and a standalone manifest", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDashboard(page);

    await expect(
      page.locator('meta[name="apple-mobile-web-app-capable"]')
    ).toHaveAttribute("content", "yes");
    await expect(
      page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')
    ).toHaveAttribute("content", "default");
    await expect(
      page.locator('meta[name="apple-mobile-web-app-title"]')
    ).toHaveAttribute("content", "Goyo");
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "href",
      "/icons/icon-192.png"
    );

    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    expect(manifestHref).toBeTruthy();
    const manifest = await page.evaluate(
      href => fetch(href).then(response => response.json()),
      manifestHref!
    );
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
  });

  test("shows the Home Screen hint once, after the first graded card", async ({
    page,
  }) => {
    // A new context starts with empty storage, so the first graded card is the
    // learner's first study activity. No init script here: it would run again
    // on the reload below and wipe the hint this test is checking.
    await page.goto("/");
    await waitForDashboard(page);
    await expect(
      page.getByText("Add Goyo to your Home Screen", { exact: true })
    ).toHaveCount(0);

    await startSession(page);
    await gradeOneCard(page);

    // Close the session so the toast is read on the dashboard, not behind the
    // modal overlay.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(
      page.getByText("Add Goyo to your Home Screen", { exact: true })
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(key => window.localStorage.getItem(key), INSTALL_HINT_KEY)
      )
      .toBe("1");

    // The hint is one-time per device: a second graded card never repeats it.
    await page.reload();
    await waitForDashboard(page);
    await startSession(page);
    await gradeOneCard(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(
      page.getByText("Add Goyo to your Home Screen", { exact: true })
    ).toHaveCount(0);
  });
});

const index = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "public", "audio", "index.json"),
    "utf8"
  )
) as { alphabet: { consonants: Record<string, string> } };
const hangulClip = index.alphabet.consonants.cons_001;

test.describe("offline on WebKit", () => {
  test("the shell, audio index and a Hangul clip resolve with the network off", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.reload();
    await waitForDashboard(page);
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller))
      )
      .toBe(true);

    await context.setOffline(true);
    try {
      await page.reload();
      await waitForDashboard(page);

      for (const url of ["/audio/index.json", `/audio/${hangulClip}`]) {
        await expect
          .poll(() =>
            page.evaluate(
              href =>
                fetch(href).then(
                  response => response.ok,
                  () => false
                ),
              url
            )
          )
          .toBe(true);
      }
    } finally {
      await context.setOffline(false);
    }
  });
});

test.describe("update notice on WebKit", () => {
  test("the service worker registers and controls the page", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDashboard(page);

    // The waiting-worker update toast needs a second production build to
    // produce a new worker, so it is not simulated here. That check stays a
    // manual step (see docs/improvement-plan.md, Phase 4 item 5).
    const registration = await page.evaluate(async () => {
      const found = await navigator.serviceWorker.ready;
      return {
        scope: found.scope,
        active: Boolean(found.active),
      };
    });
    expect(registration.active).toBe(true);
    expect(registration.scope).toMatch(/\/$/);
  });
});
