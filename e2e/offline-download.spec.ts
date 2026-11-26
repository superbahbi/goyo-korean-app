import { expect, test } from "@playwright/test";

/**
 * "Download all audio" stores every enabled word and sentence clip in the
 * Cache API. The clip responses are stubbed with a few bytes of audio/mpeg so
 * the run stays fast; the plan, the batching, the cache writes and the cached
 * count are all real.
 */

// The download writes through the page's Cache API. A service worker would
// answer the plain clip URLs itself, so keep it out of the way.
test.use({ serviceWorkers: "block" });

const STUB_CLIP = Buffer.from([0xff, 0xfb, 0x90, 0x00]);

test("downloads every clip, reports progress, and remembers it next time", async ({
  page,
}) => {
  let warmRequests = 0;
  await page.route(/\/audio\/[^/]+\.mp3\?warm=1$/, async route => {
    warmRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      body: STUB_CLIP,
    });
  });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");

  await page.getByRole("button", { name: "Open settings" }).click();
  const settings = page.getByRole("dialog");
  const status = settings.getByText(/clips (are )?cached on this device\.$/);
  await expect(status).toHaveText(/^0 of \d+ clips cached on this device\.$/);
  const total = Number(/of (\d+) clips/.exec(await status.innerText())![1]);
  expect(total).toBeGreaterThan(1000);

  await settings.getByRole("button", { name: "Download all audio" }).click();
  await expect(
    settings.getByRole("progressbar", { name: "Audio download progress" })
  ).toBeVisible();
  await expect(page.getByText("Audio is ready offline")).toBeVisible({
    timeout: 60_000,
  });
  await expect(status).toHaveText(
    `All ${total} clips are cached on this device.`
  );
  await expect(
    settings.getByRole("button", { name: "Verify offline audio" })
  ).toBeVisible();
  expect(warmRequests).toBe(total);

  // A fresh dialog counts the Cache API again instead of trusting memory.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(
    page.getByRole("dialog").getByText(/clips are cached/)
  ).toHaveText(`All ${total} clips are cached on this device.`);
});
