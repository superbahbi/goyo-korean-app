import { expect, test, type Page } from "@playwright/test";

const PROGRESS_KEY = "goyo-progress-v2";

interface SavedGrammar {
  grammar: {
    completedLessonIds: string[];
    scores: Record<string, { correct: number; total: number }>;
    lastLessonId?: string;
  };
}

function readGrammar(page: Page) {
  return page.evaluate(key => {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedGrammar).grammar : null;
  }, PROGRESS_KEY);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  // A first-run dashboard keeps the practice grid collapsed behind a disclosure,
  // so open it before looking for a tile (and cover that toggle here too).
  await page.getByRole("button", { name: /show all \d+/i }).click();
});

test("reads a grammar lesson, plays an example and records the check", async ({
  page,
}) => {
  const tile = page.getByRole("button", { name: /grammar lessons/i });
  await expect(tile).toContainText("12 TOPIK I patterns");
  await tile.click();

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Grammar Lessons" })
  ).toBeVisible();
  await expect(dialog.getByText("0 / 12")).toBeVisible();

  await dialog.getByRole("button", { name: /이에요 \/ 예요/ }).click();
  await expect(
    dialog.getByRole("heading", { name: "이에요 / 예요" })
  ).toBeVisible();

  // The first lesson's examples have generated clips, so the player is shown.
  await dialog
    .getByRole("button", { name: "Play example: 저는 학생이에요." })
    .click();

  // Question 1: 의사 takes 예요.
  await dialog.getByRole("button", { name: /A\s*예요/ }).click();
  await expect(dialog.getByText("Correct.")).toBeVisible();
  await dialog.getByRole("button", { name: "Next question" }).click();

  // Question 2: 책 takes 이에요.
  await dialog.getByRole("button", { name: /B\s*책이에요/ }).click();
  await dialog.getByRole("button", { name: "See result" }).click();
  await expect(dialog.getByText("2 of 2 correct")).toBeVisible();

  // Progress is saved in the same exportable state as vocabulary progress.
  await expect
    .poll(async () => (await readGrammar(page))?.scores.copula)
    .toEqual({ correct: 2, total: 2 });
  expect((await readGrammar(page))?.completedLessonIds).toEqual(["copula"]);

  await dialog.getByRole("button", { name: "All lessons" }).click();
  await expect(
    dialog.getByRole("button", { name: /이에요 \/ 예요/ })
  ).toContainText("2/2");

  await page.keyboard.press("Escape");
  await expect(tile).toContainText("1 of 12 lessons complete");
});
