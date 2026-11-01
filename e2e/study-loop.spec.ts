import { expect, test, type Page } from "@playwright/test";

const PROGRESS_KEY = "goyo-progress-v2";

interface SavedProgress {
  cardStates: Record<string, unknown>;
  reviewLog: { entries: unknown[] };
  stats: { totalXp: number };
  studyDays: Record<string, { cards: number }>;
}

function readProgress(page: Page) {
  return page.evaluate(key => {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedProgress) : null;
  }, PROGRESS_KEY);
}

// A fresh save hides the dashboard hero, so wait on the first-session action
// instead of the returning-learner heading.
async function startFreshSession(page: Page) {
  await page
    .getByRole("button", { name: /start (daily|first) session/i })
    .click();
}

test.beforeEach(async ({ page }) => {
  // Every smoke starts from a fresh learner: no saved progress, no backup age.
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
});

test("completes the daily session with the keyboard and saves progress", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: /start first session/i })
  ).toBeVisible();

  await startFreshSession(page);

  // A fresh learner gets the default three new cards. Each word is introduced
  // first (Enter), then Space reveals and 2 grades Good, so the whole session
  // runs without touching the mouse.
  for (let graded = 1; graded <= 3; graded += 1) {
    await expect(page.getByText("New word", { exact: true })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: /reveal korean/i })
    ).toBeVisible();
    await page.keyboard.press("Space");
    await expect(page.getByText("How did that feel?")).toBeVisible();
    await page.keyboard.press("2");
  }

  await expect(
    page.getByText("Session complete", { exact: true })
  ).toBeVisible();

  // The save runs in an effect after the summary paints, so poll until it lands.
  await expect
    .poll(async () => (await readProgress(page))?.reviewLog.entries.length ?? 0)
    .toBe(3);
  const saved = await readProgress(page);

  expect(saved).not.toBeNull();
  expect(Object.keys(saved!.cardStates)).toHaveLength(3);
  expect(saved!.stats.totalXp).toBeGreaterThan(0);

  const studied = Object.values(saved!.studyDays).reduce(
    (total, day) => total + day.cards,
    0
  );
  expect(studied).toBe(3);
});

test("introduces a new word without logging a grade", async ({ page }) => {
  await startFreshSession(page);

  await expect(page.getByText("New word", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /start practising/i }).click();

  // Presentation only: advancing the intro writes no review and no card state.
  await expect.poll(async () => (await readProgress(page)) !== null).toBe(true);
  const afterIntro = await readProgress(page);
  expect(afterIntro!.reviewLog.entries).toHaveLength(0);
  expect(afterIntro!.cardStates).toEqual({});

  await page.keyboard.press("Space");
  await expect(page.getByText("How did that feel?")).toBeVisible();
  await page.keyboard.press("2");
  await expect
    .poll(async () => (await readProgress(page))?.reviewLog.entries.length ?? 0)
    .toBe(1);
});

test("brings a failed card back once before the summary", async ({ page }) => {
  await startFreshSession(page);

  // Fail the first card: it re-enters at the end, so the session runs four
  // reviews while the deck still only gains three cards.
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await page.keyboard.press("1");
  for (let graded = 1; graded <= 2; graded += 1) {
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await page.keyboard.press("2");
  }

  // The retry was already introduced, so it opens on its recall card.
  await page.keyboard.press("Space");
  await page.keyboard.press("2");

  await expect(
    page.getByText("Session complete", { exact: true })
  ).toBeVisible();

  await expect
    .poll(async () => (await readProgress(page))?.reviewLog.entries.length ?? 0)
    .toBe(4);
  const saved = await readProgress(page);

  expect(Object.keys(saved!.cardStates)).toHaveLength(3);
});
