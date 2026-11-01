import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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

// A learner with five reviewed cards, so the recognition modes open and Stats
// has real history to render. Audio is off so grading never depends on a clip.
function seedProgress() {
  const today = dayKey();
  const cardIds = ["surv_001", "surv_002", "surv_003", "surv_004", "surv_005"];
  const cardStates = Object.fromEntries(
    cardIds.map(id => [
      id,
      {
        id,
        // Due tomorrow, so the daily queue is the three new cards and the
        // session length stays predictable.
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
  );

  return {
    schemaVersion: 4,
    cardStates,
    stats: {
      totalXp: 120,
      level: 2,
      streak: 3,
      lastStudyDate: today,
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

async function audit(page: Page, label: string, scope?: string) {
  // Give Framer Motion and Radix their enter transition before sampling colors
  // and focus order.
  await page.waitForTimeout(500);
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ]);
  // A modal dims and inerts the dashboard behind it, so only audit the dialog
  // itself; the dashboard has its own scan.
  if (scope) builder = builder.include(scope);
  const results = await builder.analyze();

  const violations = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map(node => ({
      target: node.target.join(" "),
      html: node.html,
      summary: node.failureSummary,
    })),
  }));
  if (violations.length > 0) {
    console.log(`A11Y ${label}\n${JSON.stringify(violations, null, 2)}`);
  }
  return violations;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([key, state]) => window.localStorage.setItem(key, JSON.stringify(state)),
    [PROGRESS_KEY, seedProgress()] as const
  );
  await page.goto("/");
});

test("dashboard has no WCAG A/AA violations", async ({ page }) => {
  await expect(
    page.getByText("Ready to practice?", { exact: true })
  ).toBeVisible();
  expect(await audit(page, "dashboard")).toEqual([]);
});

test("study session has no WCAG A/AA violations", async ({ page }) => {
  await page.getByRole("button", { name: /start daily session/i }).click();
  expect(await audit(page, "study intro", '[role="dialog"]')).toEqual([]);

  await page.keyboard.press("Enter");
  expect(await audit(page, "study front", '[role="dialog"]')).toEqual([]);

  await page.keyboard.press("Space");
  expect(await audit(page, "study back", '[role="dialog"]')).toEqual([]);

  for (let graded = 1; graded <= 3; graded += 1) {
    if (graded > 1) {
      await page.keyboard.press("Enter");
      await page.keyboard.press("Space");
    }
    await page.keyboard.press("2");
  }
  await expect(
    page.getByText("Session complete", { exact: true })
  ).toBeVisible();
  expect(await audit(page, "study summary", '[role="dialog"]')).toEqual([]);
});

test("dialogs have no WCAG A/AA violations", async ({ page }) => {
  await page.getByRole("button", { name: "Browse Deck" }).click();
  await expect(page.getByRole("dialog")).toContainText("Vocabulary library");
  expect(await audit(page, "browse", '[role="dialog"]')).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: "Full Stats" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await audit(page, "stats", '[role="dialog"]')).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("dialog")).toContainText("Progress file");
  expect(await audit(page, "settings", '[role="dialog"]')).toEqual([]);
});

test("Hangul practice has no WCAG A/AA violations", async ({ page }) => {
  await page.getByRole("button", { name: /learn hangul/i }).click();
  expect(await audit(page, "alphabet categories", '[role="dialog"]')).toEqual(
    []
  );

  await page.getByRole("button", { name: /consonants/i }).click();
  expect(await audit(page, "alphabet cards", '[role="dialog"]')).toEqual([]);
});

test("recognition practice has no WCAG A/AA violations", async ({ page }) => {
  await page.getByRole("button", { name: /listening practice/i }).click();
  expect(await audit(page, "listening", '[role="dialog"]')).toEqual([]);
  await page
    .getByRole("button", { name: /^[A-D] / })
    .first()
    .click();
  expect(await audit(page, "listening answered", '[role="dialog"]')).toEqual(
    []
  );
  await page.getByRole("button", { name: "Close listening practice" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: /survival scenarios/i }).click();
  expect(await audit(page, "scenario", '[role="dialog"]')).toEqual([]);
  await page
    .getByRole("button", { name: /^[A-D] / })
    .first()
    .click();
  expect(await audit(page, "scenario answered", '[role="dialog"]')).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: /shadowing practice/i }).click();
  expect(await audit(page, "shadowing", '[role="dialog"]')).toEqual([]);
  await page.getByRole("button", { name: "Reveal Korean" }).click();
  expect(await audit(page, "shadowing revealed", '[role="dialog"]')).toEqual(
    []
  );
});

test("grammar lessons have no WCAG A/AA violations", async ({ page }) => {
  await page.getByRole("button", { name: /grammar lessons/i }).click();
  const dialog = page.getByRole("dialog");
  expect(await audit(page, "grammar list", '[role="dialog"]')).toEqual([]);

  await dialog.getByRole("button", { name: /이에요 \/ 예요/ }).click();
  expect(await audit(page, "grammar lesson", '[role="dialog"]')).toEqual([]);

  await dialog.getByRole("button", { name: /A\s*예요/ }).click();
  expect(await audit(page, "grammar answered", '[role="dialog"]')).toEqual([]);
});
