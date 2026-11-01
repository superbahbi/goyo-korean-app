import { expect, test, type Locator, type Page } from "@playwright/test";

// axe checks markup rules. These checks cover what it does not: the keyboard
// path through a study session, the accessible names a screen reader announces,
// what the aria-live regions expose after a grade, and whether Tab and arrow
// keys reach the dashboard cards and the Stats category list.

const PROGRESS_KEY = "goyo-progress-v2";

function dayKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// Matches the axe suite's learner: five reviewed cards, so every surface has
// data and the three daily cards are new. Audio is off so no clip is needed.
function seedProgress() {
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
          lastResponseTimeMs: 2400,
          lapseCount: 0,
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
      autoPlayAudio: false,
      audioSpeaker: "elevenlabs",
    },
    reviewLog: {
      schemaVersion: 1,
      entries: cardIds.map((cardId, index) => ({
        cardId,
        at: new Date(Date.now() - index * 60_000).toISOString(),
        rating: "good",
        responseTimeMs: 2400,
        mode: "daily",
      })),
    },
    studyDays: Object.fromEntries(
      [-3, -2, -1, 0].map(offset => [dayKey(offset), { cards: 5, reviews: 5 }])
    ),
  };
}

interface SavedReview {
  rating: string;
  cardId: string;
}

function readReviewLog(page: Page) {
  return page.evaluate(key => {
    const raw = window.localStorage.getItem(key);
    const saved = raw ? (JSON.parse(raw) as { reviewLog: unknown }) : null;
    return (
      (saved?.reviewLog as { entries: SavedReview[] } | null)?.entries ?? []
    );
  }, PROGRESS_KEY);
}

// Presses Tab until the locator is the focused element. Fails with a clear
// message instead of hanging if focus never arrives.
async function tabTo(page: Page, target: Locator, maxPresses = 60) {
  for (let press = 0; press < maxPresses; press += 1) {
    const focused = await target.evaluate(
      element => element === document.activeElement
    );
    if (focused) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Focus never reached the target after ${maxPresses} Tabs`);
}

async function focusedInsideDialog(page: Page) {
  return page.evaluate(() =>
    Boolean(document.activeElement?.closest('[role="dialog"]'))
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([key, state]) => window.localStorage.setItem(key, JSON.stringify(state)),
    [PROGRESS_KEY, seedProgress()] as const
  );
  await page.goto("/");
  await expect(
    page.getByText("Ready to practice?", { exact: true })
  ).toBeVisible();
});

test("keyboard study flow: Space reveals, 1/2/3 grade, Escape closes", async ({
  page,
}) => {
  await page.getByRole("button", { name: /start daily session/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await focusedInsideDialog(page)).toBe(true);

  // Space reveals and moves the prompt to the grading choices.
  await page.keyboard.press("Space");
  await expect(dialog.getByText("How did that feel?")).toBeVisible();
  expect(await focusedInsideDialog(page)).toBe(true);

  // 1 Again, 2 Good, 3 Easy. A failed card returns once at the end, so the
  // fourth review is the retry of card one.
  await page.keyboard.press("1");
  await page.keyboard.press("Space");
  await page.keyboard.press("2");
  await page.keyboard.press("Space");
  await page.keyboard.press("3");
  await page.keyboard.press("Space");
  await page.keyboard.press("2");

  await expect(
    page.getByText("Session complete", { exact: true })
  ).toBeVisible();
  // The learner starts with five seeded reviews; the session appends four.
  const seededReviews = 5;
  await expect
    .poll(async () => (await readReviewLog(page)).length)
    .toBe(seededReviews + 4);
  const ratings = (await readReviewLog(page))
    .slice(seededReviews)
    .map(entry => entry.rating);
  expect(ratings).toEqual(["again", "good", "easy", "good"]);

  await page.getByRole("button", { name: "Return to dashboard" }).click();
  await expect(dialog).toBeHidden();
});

test("Escape closes a session in progress and returns focus to its opener", async ({
  page,
}) => {
  const opener = page.getByRole("button", { name: /start daily session/i });
  await opener.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Space");
  await expect(dialog.getByText("How did that feel?")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
  await expect(
    page.getByText("Ready to practice?", { exact: true })
  ).toBeVisible();
  await expect(opener).toBeFocused();
});

test("grade buttons and the dialog have accessible names", async ({ page }) => {
  await page.getByRole("button", { name: /start daily session/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName("Daily Session");

  await page.keyboard.press("Space");
  await expect(dialog.getByText("How did that feel?")).toBeVisible();

  await expect(dialog.getByRole("button", { name: /^Again\b/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^Good\b/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^Easy\b/ })).toBeVisible();
});

test("aria-live regions announce each prompt after a grade", async ({
  page,
}) => {
  await page.getByRole("button", { name: /start daily session/i }).click();
  const dialog = page.getByRole("dialog");
  const liveRegion = dialog.locator('[aria-live="polite"][aria-atomic="true"]');

  await expect(liveRegion).toHaveText(/Card 1 of 3\. Press Space to reveal\./);

  await page.keyboard.press("Space");
  await expect(liveRegion).toHaveText(
    /Answer revealed\. Press 1 for Again, 2 for Good, or 3 for Easy\./
  );

  await page.keyboard.press("2");
  await expect(liveRegion).toHaveText(/Card 2 of 3\. Press Space to reveal\./);
});

test("Listening verdict is exposed through a polite live region", async ({
  page,
}) => {
  await page.getByRole("button", { name: /listening practice/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog
    .getByRole("button", { name: /^[A-D] / })
    .first()
    .click();

  const verdict = dialog.locator('[aria-live="polite"]').filter({
    hasText: /Correct — nice listening\.|The answer is/,
  });
  await expect(verdict).toBeVisible();
});

test("dashboard cards are reachable with Tab and operable with Enter", async ({
  page,
}) => {
  const cards = [
    page.getByRole("button", { name: /learn hangul/i }),
    page.getByRole("button", { name: /listening practice/i }),
    page.getByRole("button", { name: /survival scenarios/i }),
    page.getByRole("button", { name: /shadowing practice/i }),
    page.getByRole("button", { name: /^View all/ }),
  ];
  for (const card of cards) {
    await tabTo(page, card);
    await expect(card).toBeFocused();
  }

  // Enter is the keyboard activation for a card, not only a mouse click.
  await cards[1].focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText(/listening/i);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the Stats category list is reachable with Tab and scrolls with arrow keys", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Full Stats" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const categories = dialog.getByRole("group", {
    name: "Category mastery by category",
  });
  await tabTo(page, categories);
  await expect(categories).toBeFocused();

  // The list scrolls when it overflows. Arrow keys must move through it; a
  // list that only scrolls with the mouse is a keyboard trap for some users.
  const overflows = await categories.evaluate(
    element => element.scrollHeight > element.clientHeight
  );
  expect(overflows).toBe(true);
  await expect
    .poll(async () => {
      await page.keyboard.press("ArrowDown");
      return categories.evaluate(element => element.scrollTop);
    })
    .toBeGreaterThan(0);
});
