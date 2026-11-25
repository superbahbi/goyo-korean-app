// Verifies that the built SPA entry (`dist/public/index.html`) satisfies the
// `Content-Security-Policy` header configured in `vercel.json`.
//
// In particular, `script-src 'self'` forbids inline `<script>` blocks, inline
// `on*=` event handlers, and third-party script origins, and every local
// `<script src="/...">` must exist inside `dist/public/`.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
export const DEFAULT_VERCEL_CONFIG_PATH = path.join(REPO_ROOT, "vercel.json");
export const DEFAULT_PUBLIC_DIR = path.join(REPO_ROOT, "dist", "public");
export const DEFAULT_HTML_PATH = path.join(DEFAULT_PUBLIC_DIR, "index.html");

export interface VercelHeaderRule {
  source?: string;
  headers?: Array<{ key: string; value: string }>;
}

export interface VercelConfig {
  headers?: VercelHeaderRule[];
}

export interface ParsedAttribute {
  name: string;
  value: string;
}

export interface ParsedTag {
  tagName: string;
  attributes: ParsedAttribute[];
  body: string;
}

export interface ValidateCspOptions {
  html: string;
  cspHeader: string;
  publicDir: string;
  fileExists?: (filePath: string) => boolean;
}

export interface CspCheckResult {
  ok: boolean;
  errors: string[];
  scriptCount: number;
}

/** Parses a CSP header string into a map of lowercase directive names to source tokens. */
export function parseCspDirectives(cspHeader: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const rawDirective of cspHeader.split(";")) {
    const trimmed = rawDirective.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const name = parts[0].toLowerCase();
    if (!directives.has(name)) {
      directives.set(name, parts.slice(1));
    }
  }
  return directives;
}

/** Extracts the `Content-Security-Policy` header value from a parsed `vercel.json`. */
export function extractCspFromVercelConfig(config: VercelConfig): string {
  const rules = config.headers ?? [];
  const matches: string[] = [];

  for (const rule of rules) {
    for (const header of rule.headers ?? []) {
      if (header.key.toLowerCase() === "content-security-policy") {
        matches.push(header.value);
      }
    }
  }

  if (matches.length === 0) {
    throw new Error("No Content-Security-Policy header found in vercel.json");
  }

  return matches[0];
}

function parseAttributes(
  input: string,
  startIndex: number
): { attributes: ParsedAttribute[]; endIndex: number } {
  const attributes: ParsedAttribute[] = [];
  let i = startIndex;
  const len = input.length;

  while (i < len) {
    while (i < len && /\s/.test(input[i])) i++;
    if (i >= len) break;
    if (input[i] === ">") {
      return { attributes, endIndex: i + 1 };
    }
    if (input[i] === "/" && input[i + 1] === ">") {
      return { attributes, endIndex: i + 2 };
    }

    const nameStart = i;
    while (i < len && !/[\s=/>]/.test(input[i])) i++;
    const name = input.slice(nameStart, i).toLowerCase();
    if (!name) {
      i++;
      continue;
    }

    while (i < len && /\s/.test(input[i])) i++;
    let value = "";
    if (input[i] === "=") {
      i++;
      while (i < len && /\s/.test(input[i])) i++;
      const quote = input[i];
      if (quote === '"' || quote === "'") {
        i++;
        const valStart = i;
        while (i < len && input[i] !== quote) i++;
        value = input.slice(valStart, i);
        if (input[i] === quote) i++;
      } else {
        const valStart = i;
        while (i < len && !/[\s>]/.test(input[i])) i++;
        value = input.slice(valStart, i);
      }
    }

    attributes.push({ name, value });
  }

  return { attributes, endIndex: i };
}

/**
 * Extracts opening HTML tags (ignoring HTML comments, doctype, and closing tags).
 * For `<script>` elements, captures the raw body up to `</script>` so JS text is
 * never misparsed as HTML markup.
 */
export function extractHtmlTags(html: string): ParsedTag[] {
  const tags: ParsedTag[] = [];
  let i = 0;
  const len = html.length;

  while (i < len) {
    const lt = html.indexOf("<", i);
    if (lt === -1) break;

    if (html.startsWith("<!--", lt)) {
      const commentEnd = html.indexOf("-->", lt + 4);
      i = commentEnd === -1 ? len : commentEnd + 3;
      continue;
    }

    if (html[lt + 1] === "!" || html[lt + 1] === "/" || html[lt + 1] === "?") {
      const gt = html.indexOf(">", lt + 2);
      i = gt === -1 ? len : gt + 1;
      continue;
    }

    let nameEnd = lt + 1;
    while (nameEnd < len && /[a-zA-Z0-9:-]/.test(html[nameEnd])) {
      nameEnd++;
    }
    if (nameEnd === lt + 1) {
      i = lt + 1;
      continue;
    }

    const tagName = html.slice(lt + 1, nameEnd).toLowerCase();
    const { attributes, endIndex } = parseAttributes(html, nameEnd);
    let body = "";
    i = endIndex;

    if (tagName === "script") {
      const closeMatch = /<\/script\s*>/i.exec(html.slice(i));
      if (closeMatch) {
        body = html.slice(i, i + closeMatch.index);
        i = i + closeMatch.index + closeMatch[0].length;
      } else {
        body = html.slice(i);
        i = len;
      }
    }

    tags.push({ tagName, attributes, body });
  }

  return tags;
}

function unquoteSourceToken(token: string): string {
  if (token.length >= 2 && token.startsWith("'") && token.endsWith("'")) {
    return token.slice(1, -1);
  }
  return token;
}

function isInlineScriptAllowedByHashOrNonce(
  tag: ParsedTag,
  scriptSrcTokens: string[]
): boolean {
  const nonceAttr = tag.attributes.find(attr => attr.name === "nonce")?.value;
  for (const rawToken of scriptSrcTokens) {
    const token = unquoteSourceToken(rawToken);
    if (nonceAttr && token === `nonce-${nonceAttr}`) {
      return true;
    }
    const hashMatch = /^(sha256|sha384|sha512)-(.+)$/.exec(token);
    if (hashMatch) {
      const digest = createHash(hashMatch[1])
        .update(tag.body, "utf8")
        .digest("base64");
      if (digest === hashMatch[2]) {
        return true;
      }
    }
  }
  return false;
}

function isExternalUrl(src: string): boolean {
  return /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/.test(src);
}

function isExternalSrcAllowed(src: string, scriptSrcTokens: string[]): boolean {
  let parsed: URL;
  try {
    parsed = src.startsWith("//") ? new URL(`https:${src}`) : new URL(src);
  } catch {
    return false;
  }

  for (const rawToken of scriptSrcTokens) {
    if (rawToken.startsWith("'")) continue;
    if (rawToken === "*")
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    if (rawToken.endsWith(":") && parsed.protocol === rawToken) {
      return true;
    }
    try {
      const allowedUrl = rawToken.includes("://")
        ? new URL(rawToken)
        : new URL(`${parsed.protocol}//${rawToken}`);
      if (allowedUrl.origin === parsed.origin) {
        return true;
      }
    } catch {
      // Ignore malformed/wildcard tokens that didn't parse as a URL.
    }
  }

  return false;
}

function defaultFileExists(filePath: string): boolean {
  try {
    return existsSync(filePath) && statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/** Validates an HTML document against the `script-src` (or `default-src`) CSP directive. */
export function validateHtmlAgainstCsp(options: ValidateCspOptions): string[] {
  const {
    html,
    cspHeader,
    publicDir,
    fileExists = defaultFileExists,
  } = options;
  const directives = parseCspDirectives(cspHeader);
  const scriptSrcTokens =
    directives.get("script-src") ?? directives.get("default-src");

  if (!scriptSrcTokens || scriptSrcTokens.length === 0) {
    return ["CSP is missing both script-src and default-src directives"];
  }

  const allowsUnsafeInline = scriptSrcTokens.includes("'unsafe-inline'");
  const allowsSelf = scriptSrcTokens.includes("'self'");
  const blocksAllScripts = scriptSrcTokens.includes("'none'");
  const resolvedPublicDir = path.resolve(publicDir);

  const errors: string[] = [];
  const tags = extractHtmlTags(html);

  for (const tag of tags) {
    for (const attr of tag.attributes) {
      if (/^on[a-z]+$/i.test(attr.name) && !allowsUnsafeInline) {
        errors.push(
          `Inline event-handler attribute "${attr.name}" on <${tag.tagName}> violates CSP script-src`
        );
      }
    }

    if (tag.tagName !== "script") continue;

    if (blocksAllScripts) {
      errors.push(`<script> tag is disallowed when script-src is 'none'`);
      continue;
    }

    const srcAttr = tag.attributes.find(attr => attr.name === "src");
    const src = srcAttr?.value.trim() ?? "";

    if (!src) {
      if (
        !allowsUnsafeInline &&
        !isInlineScriptAllowedByHashOrNonce(tag, scriptSrcTokens)
      ) {
        errors.push(
          `Inline <script> tag without a non-empty src attribute violates CSP script-src (${scriptSrcTokens.join(" ")})`
        );
      }
      continue;
    }

    if (isExternalUrl(src)) {
      if (!isExternalSrcAllowed(src, scriptSrcTokens)) {
        errors.push(
          `<script src="${src}"> points to an origin disallowed by CSP script-src (${scriptSrcTokens.join(" ")})`
        );
      }
      continue;
    }

    if (!allowsSelf) {
      errors.push(
        `Local <script src="${src}"> requires 'self' in CSP script-src (${scriptSrcTokens.join(" ")})`
      );
      continue;
    }

    const cleanPath = src.split(/[?#]/)[0];
    const relativePath = cleanPath.startsWith("/")
      ? cleanPath.slice(1)
      : cleanPath;
    const targetFile = path.resolve(resolvedPublicDir, relativePath);

    if (
      targetFile !== resolvedPublicDir &&
      !targetFile.startsWith(`${resolvedPublicDir}${path.sep}`)
    ) {
      errors.push(
        `<script src="${src}"> resolves outside ${resolvedPublicDir}`
      );
      continue;
    }

    if (!fileExists(targetFile)) {
      errors.push(
        `<script src="${src}"> references missing file ${path.relative(REPO_ROOT, targetFile)}`
      );
    }
  }

  return errors;
}

/** Runs the CSP check against `vercel.json` and the built `dist/public/index.html`. */
export function checkProductionCsp(options?: {
  vercelConfigPath?: string;
  htmlPath?: string;
  publicDir?: string;
}): CspCheckResult {
  const vercelConfigPath =
    options?.vercelConfigPath ?? DEFAULT_VERCEL_CONFIG_PATH;
  const htmlPath = options?.htmlPath ?? DEFAULT_HTML_PATH;
  const publicDir = options?.publicDir ?? DEFAULT_PUBLIC_DIR;

  const vercelConfig = JSON.parse(
    readFileSync(vercelConfigPath, "utf8")
  ) as VercelConfig;
  const cspHeader = extractCspFromVercelConfig(vercelConfig);
  const html = readFileSync(htmlPath, "utf8");
  const scriptCount = extractHtmlTags(html).filter(
    tag => tag.tagName === "script"
  ).length;
  const errors = validateHtmlAgainstCsp({ html, cspHeader, publicDir });

  return {
    ok: errors.length === 0,
    errors,
    scriptCount,
  };
}

function main(): void {
  const result = checkProductionCsp();
  if (result.ok) {
    console.log(
      `CSP check passed (${result.scriptCount} <script> tags verified in dist/public/index.html)`
    );
    return;
  }

  console.error(
    `CSP check failed with ${result.errors.length} violation${result.errors.length === 1 ? "" : "s"}:`
  );
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
