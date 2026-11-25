import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractCspFromVercelConfig,
  parseCspDirectives,
  validateHtmlAgainstCsp,
} from "./check-csp";

const STRICT_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com; manifest-src 'self'; worker-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

const PUBLIC_DIR = "/virtual/dist/public";

function makeExists(...relativePaths: string[]) {
  const allowed = new Set(
    relativePaths.map(rel => path.resolve(PUBLIC_DIR, rel))
  );
  return (filePath: string) => allowed.has(path.resolve(filePath));
}

describe("check-csp", () => {
  it("extracts Content-Security-Policy and script-src from vercel config", () => {
    const csp = extractCspFromVercelConfig({
      headers: [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Content-Security-Policy", value: STRICT_CSP },
          ],
        },
      ],
    });

    expect(csp).toBe(STRICT_CSP);
    expect(parseCspDirectives(csp).get("script-src")).toEqual(["'self'"]);
  });

  it("passes clean HTML with local same-origin scripts that exist on disk", () => {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <script src="/theme-init.js"></script>
    <script type="module" crossorigin src="/assets/index-abc123.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

    const errors = validateHtmlAgainstCsp({
      html,
      cspHeader: STRICT_CSP,
      publicDir: PUBLIC_DIR,
      fileExists: makeExists("theme-init.js", "assets/index-abc123.js"),
    });

    expect(errors).toEqual([]);
  });

  it("ignores script-like markup and handlers inside HTML comments", () => {
    const html = `<!doctype html>
<html>
  <head>
    <!-- <script>alert("commented")</script> <div onclick="nope()"></div> -->
    <script src="/theme-init.js"></script>
  </head>
</html>`;

    const errors = validateHtmlAgainstCsp({
      html,
      cspHeader: STRICT_CSP,
      publicDir: PUBLIC_DIR,
      fileExists: makeExists("theme-init.js"),
    });

    expect(errors).toEqual([]);
  });

  it("detects inline <script> tags without a non-empty src", () => {
    const html = `<!doctype html>
<html>
  <head>
    <script>console.log("inline");</script>
  </head>
</html>`;

    const errors = validateHtmlAgainstCsp({
      html,
      cspHeader: STRICT_CSP,
      publicDir: PUBLIC_DIR,
      fileExists: makeExists(),
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Inline <script>/i);
  });

  it("detects inline on*= event-handler attributes in HTML elements", () => {
    const html = `<!doctype html>
<html>
  <body>
    <button type="button" onclick="handleClick()">Start</button>
    <img src="/icons/icon-192.png" onerror="fallback()" />
  </body>
</html>`;

    const errors = validateHtmlAgainstCsp({
      html,
      cspHeader: STRICT_CSP,
      publicDir: PUBLIC_DIR,
      fileExists: makeExists(),
    });

    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/onclick/i);
    expect(errors[1]).toMatch(/onerror/i);
  });

  it("detects <script src> pointing to an origin disallowed by script-src", () => {
    const html = `<!doctype html>
<html>
  <head>
    <script src="https://cdn.example.com/analytics.js"></script>
    <script src="//cdn.example.com/proto-relative.js"></script>
  </head>
</html>`;

    const errors = validateHtmlAgainstCsp({
      html,
      cspHeader: STRICT_CSP,
      publicDir: PUBLIC_DIR,
      fileExists: makeExists(),
    });

    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/https:\/\/cdn\.example\.com\/analytics\.js/);
    expect(errors[1]).toMatch(/\/\/cdn\.example\.com\/proto-relative\.js/);
  });

  it("detects missing local script files referenced by /... src", () => {
    const html = `<!doctype html>
<html>
  <head>
    <script src="/theme-init.js"></script>
    <script type="module" src="/assets/missing-chunk.js"></script>
  </head>
</html>`;

    const errors = validateHtmlAgainstCsp({
      html,
      cspHeader: STRICT_CSP,
      publicDir: PUBLIC_DIR,
      fileExists: makeExists("theme-init.js"),
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/\/assets\/missing-chunk\.js/);
  });
});
