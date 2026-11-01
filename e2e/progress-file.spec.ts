import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const PROGRESS_KEY = "goyo-progress-v2";

test("exports progress and imports the same file back", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");

  // Leave one graded card behind so the exported file carries real progress.
  // A fresh learner starts from the first-run start block, not the hero.
  await page
    .getByRole("button", { name: /start (daily|first) session/i })
    .click();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await page.keyboard.press("2");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Open settings" }).click();
  const settings = page.getByRole("dialog");
  await expect(settings).toContainText("Progress file");

  const downloadPromise = page.waitForEvent("download");
  await settings.getByRole("button", { name: "Export progress" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^goyo-progress-\d{4}-\d{2}-\d{2}\.json$/
  );

  const filePath = await download.path();
  expect(filePath).not.toBeNull();
  const payload = JSON.parse(await readFile(filePath!, "utf8"));
  expect(Object.keys(payload.cardStates)).toHaveLength(1);
  expect(payload.settings.dailyGoal).toBeGreaterThan(0);

  // The backup age line moves to today once an export happens.
  await expect(settings.getByText("Last backed up today.")).toBeVisible();

  const chooserPromise = page.waitForEvent("filechooser");
  await settings.getByRole("button", { name: "Import progress" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(filePath!);

  await expect(settings.getByText("Replace current progress?")).toBeVisible();
  await settings.getByRole("button", { name: "Replace progress" }).click();
  await expect(page.getByText(/Imported progress for 1 card/)).toBeVisible();

  // The imported state persists in an effect after the toast paints.
  await expect
    .poll(() =>
      page.evaluate(key => {
        const raw = window.localStorage.getItem(key);
        return raw ? Object.keys(JSON.parse(raw).cardStates).length : 0;
      }, PROGRESS_KEY)
    )
    .toBe(1);
});
