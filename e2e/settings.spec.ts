import { expect, test } from "@playwright/test";

test("the Settings dialog keeps its header and scrolls to the last option", async ({
  page,
}) => {
  // A short laptop window is where the card used to run off the screen.
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Settings" })).toBeVisible();

  const options = dialog.getByRole("group", { name: "Settings options" });
  const overflow = await options.evaluate(element => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(overflow.scrollHeight).toBeGreaterThan(overflow.clientHeight);

  // Keyboard users can scroll the panel like the Stats category list.
  await options.focus();
  await expect
    .poll(async () => {
      await page.keyboard.press("PageDown");
      return options.evaluate(element => element.scrollTop);
    })
    .toBeGreaterThan(0);

  // The last control is reachable inside the visible viewport, and the title
  // stayed where it was.
  await options.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });
  const audioButton = dialog.getByRole("button", {
    name: "Download all audio",
  });
  const audioBox = await audioButton.boundingBox();
  const viewport = page.viewportSize()!;
  expect(audioBox).not.toBeNull();
  expect(audioBox!.y + audioBox!.height).toBeLessThanOrEqual(viewport.height);
  await expect(
    dialog.getByRole("heading", { name: "Settings" })
  ).toBeInViewport();
});
