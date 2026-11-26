import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * `vite preview` does not send the headers in vercel.json, so a script or
 * style the production CSP would block still runs in every other spec. This
 * spec adds the real Content-Security-Policy to each document response and
 * fails on any violation the page reports.
 */
interface VercelConfig {
  headers: { source: string; headers: { key: string; value: string }[] }[];
}

const vercel = JSON.parse(
  readFileSync(new URL("../vercel.json", import.meta.url), "utf8")
) as VercelConfig;
const CSP = vercel.headers
  .flatMap(rule => rule.headers)
  .find(header => header.key === "Content-Security-Policy")?.value;

// A controlling service worker would answer navigations itself, without the
// header added below.
test.use({ serviceWorkers: "block" });

async function serveWithProductionCsp(page: Page) {
  expect(CSP, "vercel.json declares a Content-Security-Policy").toBeTruthy();
  await page.route("**/*", async route => {
    if (route.request().resourceType() !== "document") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), "content-security-policy": CSP! },
    });
  });
  await page.addInitScript(() => {
    const violations: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = violations;
    document.addEventListener("securitypolicyviolation", event => {
      violations.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
}

function violations(page: Page) {
  return page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
}

test("the dashboard and a lazy dialog run under the production CSP", async ({
  page,
}) => {
  await serveWithProductionCsp(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  // public/theme-init.js is the one pre-paint script; under script-src 'self'
  // it must still run.
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("dialog")).toContainText("Progress file");

  expect(await violations(page)).toEqual([]);
});

test("/mobile runs under the production CSP", async ({ page }) => {
  await serveWithProductionCsp(page);
  await page.goto("/mobile");
  await expect(page.getByTestId("goyo-mobile-root")).toBeVisible();
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByTestId("goyo-mobile-modal")).toBeVisible();

  expect(await violations(page)).toEqual([]);
});
