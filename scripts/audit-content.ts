// Deterministic audit sampler for the imported Essential 600 deck.
//
// The sheet is evidence, not deck data: this script never writes outside
// docs/audits/ and never touches client/src/lib/essentialVocabulary.ts.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ESSENTIAL_WORDS } from "../client/src/lib/essentialVocabulary";
import type { VocabularyCard } from "../client/src/lib/vocabulary";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
export const AUDIT_DIR = path.join(REPO_ROOT, "docs", "audits");

export const DEFAULT_LIMIT = 50;
export const DEFAULT_SEED = 1;

const USAGE = `Usage: pnpm audit:content [--limit N] [--seed N] [--out FILE]

Sample imported Essential 600 cards into a deterministic Markdown audit sheet.

  --limit N    Cards to sample (default ${DEFAULT_LIMIT}, at most the imported deck size)
  --seed N     Sample seed (default ${DEFAULT_SEED}); the same seed always picks the same cards
  --out FILE   Sheet path relative to docs/audits/
               (default essential-audit-seed-<seed>-limit-<limit>.md)
  -h, --help   Show this help`;

export interface AuditOptions {
  help: boolean;
  limit: number;
  seed: number;
  out?: string;
}

/**
 * mulberry32: small, fast, and stable across Node versions. Math.random()
 * cannot be seeded, so the sampler cannot use the app's Fisher–Yates helper.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded Fisher–Yates. Every permutation is reachable and the seed fixes it. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  if (!Number.isInteger(seed) || seed < 0)
    throw new Error(`Seed must be a non-negative integer, got ${seed}.`);

  const random = mulberry32(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }
  return result;
}

/**
 * Pick `limit` distinct cards with a seeded shuffle, then sort by id so the
 * sheet reads in source order and a re-run diffs to nothing.
 */
export function sampleCards(
  cards: readonly VocabularyCard[],
  limit: number,
  seed: number
): VocabularyCard[] {
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error(`Limit must be a positive integer, got ${limit}.`);
  if (limit > cards.length)
    throw new Error(
      `Limit ${limit} exceeds the ${cards.length}-card imported deck.`
    );

  return seededShuffle(cards, seed)
    .slice(0, limit)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function cell(value: string | undefined): string {
  return (value ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

export interface AuditSheetMeta {
  seed: number;
  limit: number;
  deckSize: number;
}

/** Markdown table: one row per sampled card, with every audit field. */
export function renderAuditSheet(
  cards: readonly VocabularyCard[],
  meta: AuditSheetMeta
): string {
  const lines = [
    "# Essential 600 audit sheet",
    "",
    `${cards.length} of ${meta.deckSize} imported cards, seed ${meta.seed}.`,
    "",
    `Generated with \`pnpm audit:content --limit ${meta.limit} --seed ${meta.seed}\`. The same seed always selects the same cards. This file is generated: record verdicts in a separate JSON file instead of editing it.`,
    "",
    "| id | front | back | romanization | part of speech | example | example English | usage note | source |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const card of cards) {
    const values = [
      card.id,
      card.front,
      card.back,
      card.romanization,
      card.partOfSpeech,
      card.example,
      card.exampleEnglish,
      card.usageNote,
      card.source,
    ].map(cell);
    lines.push(`| ${values.join(" | ")} |`);
  }

  lines.push("");
  return lines.join("\n");
}

export function resolveOutputPath(
  out: string | undefined,
  seed: number,
  limit: number
): string {
  const target = out ?? `essential-audit-seed-${seed}-limit-${limit}.md`;
  const resolved = path.resolve(AUDIT_DIR, target);

  if (resolved === AUDIT_DIR || !resolved.startsWith(AUDIT_DIR + path.sep))
    throw new Error(
      `Refusing to write outside ${path.relative(REPO_ROOT, AUDIT_DIR)}/: ${target}`
    );

  return resolved;
}

function parseInteger(value: string, flag: string, minimum: number): number {
  if (!/^\d+$/.test(value))
    throw new Error(`${flag} expects an integer, got "${value}".`);

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum)
    throw new Error(
      `${flag} expects an integer of at least ${minimum}, got "${value}".`
    );
  return parsed;
}

function requireValue(
  argv: readonly string[],
  index: number,
  flag: string
): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--"))
    throw new Error(`${flag} requires a value.\n\n${USAGE}`);
  return value;
}

export function parseArgs(argv: readonly string[]): AuditOptions {
  const options: AuditOptions = {
    help: false,
    limit: DEFAULT_LIMIT,
    seed: DEFAULT_SEED,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--help":
      case "-h":
        return { ...options, help: true };
      case "--limit":
        options.limit = parseInteger(requireValue(argv, index, arg), arg, 1);
        index += 1;
        break;
      case "--seed":
        options.seed = parseInteger(requireValue(argv, index, arg), arg, 0);
        index += 1;
        break;
      case "--out":
        options.out = requireValue(argv, index, arg);
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}\n\n${USAGE}`);
    }
  }

  return options;
}

function main(argv: readonly string[]): void {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      console.log(USAGE);
      return;
    }

    const cards = sampleCards(ESSENTIAL_WORDS, options.limit, options.seed);
    const sheet = renderAuditSheet(cards, {
      seed: options.seed,
      limit: options.limit,
      deckSize: ESSENTIAL_WORDS.length,
    });
    const output = resolveOutputPath(options.out, options.seed, options.limit);

    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, sheet, "utf8");

    console.log(
      `Wrote ${cards.length} cards to ${path.relative(REPO_ROOT, output)}`
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) main(process.argv.slice(2));
