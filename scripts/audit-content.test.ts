import { describe, expect, it } from "vitest";
import path from "node:path";
import { ESSENTIAL_WORDS } from "../client/src/lib/essentialVocabulary";
import {
  AUDIT_DIR,
  DEFAULT_LIMIT,
  DEFAULT_SEED,
  parseArgs,
  renderAuditSheet,
  resolveOutputPath,
  sampleCards,
} from "./audit-content";

const ids = (cards: readonly { id: string }[]) => cards.map(card => card.id);

describe("audit sampler", () => {
  it("returns the same rows for the same seed", () => {
    const first = sampleCards(ESSENTIAL_WORDS, DEFAULT_LIMIT, DEFAULT_SEED);
    const second = sampleCards(ESSENTIAL_WORDS, DEFAULT_LIMIT, DEFAULT_SEED);
    expect(ids(first)).toEqual(ids(second));
  });

  it("returns exactly limit distinct ids that exist in the deck", () => {
    const deckIds = new Set(ESSENTIAL_WORDS.map(card => card.id));
    const sample = sampleCards(ESSENTIAL_WORDS, DEFAULT_LIMIT, DEFAULT_SEED);

    expect(sample).toHaveLength(DEFAULT_LIMIT);
    expect(new Set(ids(sample)).size).toBe(DEFAULT_LIMIT);
    for (const card of sample) expect(deckIds.has(card.id)).toBe(true);
  });

  it("picks a different sample for a different seed", () => {
    const first = sampleCards(ESSENTIAL_WORDS, DEFAULT_LIMIT, 1);
    const second = sampleCards(ESSENTIAL_WORDS, DEFAULT_LIMIT, 2);
    expect(ids(first)).not.toEqual(ids(second));
  });

  it("can sample the whole deck, including seed 0", () => {
    const sample = sampleCards(ESSENTIAL_WORDS, ESSENTIAL_WORDS.length, 0);
    expect(sample).toHaveLength(ESSENTIAL_WORDS.length);
    expect(new Set(ids(sample)).size).toBe(ESSENTIAL_WORDS.length);
  });

  it("rejects a limit outside 1..deck size", () => {
    expect(() => sampleCards(ESSENTIAL_WORDS, 0, 1)).toThrow(/positive/);
    expect(() =>
      sampleCards(ESSENTIAL_WORDS, ESSENTIAL_WORDS.length + 1, 1)
    ).toThrow(/exceeds/);
  });
});

describe("audit sheet", () => {
  it("renders every required field for every sampled card", () => {
    const sample = sampleCards(ESSENTIAL_WORDS, 5, DEFAULT_SEED);
    const sheet = renderAuditSheet(sample, {
      seed: DEFAULT_SEED,
      limit: 5,
      deckSize: ESSENTIAL_WORDS.length,
    });
    const rows = sheet
      .split("\n")
      .filter(line => line.startsWith("| essential_"));

    expect(rows).toHaveLength(5);
    for (const card of sample) {
      const row = rows.find(line => line.startsWith(`| ${card.id} |`));
      expect(row, card.id).toBeDefined();
      const values = row!
        .slice(1, -1)
        .split(" | ")
        .map(value => value.trim());
      expect(values).toEqual([
        card.id,
        card.front,
        card.back,
        card.romanization,
        card.partOfSpeech,
        card.example,
        card.exampleEnglish,
        card.usageNote,
        card.source,
      ]);
    }
  });

  it("is byte-identical for the same seed", () => {
    const meta = { seed: 7, limit: 10, deckSize: ESSENTIAL_WORDS.length };
    const first = renderAuditSheet(sampleCards(ESSENTIAL_WORDS, 10, 7), meta);
    const second = renderAuditSheet(sampleCards(ESSENTIAL_WORDS, 10, 7), meta);
    expect(first).toBe(second);
  });
});

describe("audit CLI options", () => {
  it("defaults to 50 cards and seed 1", () => {
    expect(parseArgs([])).toEqual({
      help: false,
      limit: 50,
      seed: 1,
      out: undefined,
    });
  });

  it("parses limit, seed and out", () => {
    expect(
      parseArgs(["--limit", "25", "--seed", "3", "--out", "sample.md"])
    ).toEqual({ help: false, limit: 25, seed: 3, out: "sample.md" });
  });

  it("supports --help", () => {
    expect(parseArgs(["--help"]).help).toBe(true);
    expect(parseArgs(["-h"]).help).toBe(true);
  });

  it("rejects unknown flags, missing values and bad integers", () => {
    expect(() => parseArgs(["--wat"])).toThrow(/Unknown option/);
    expect(() => parseArgs(["--seed"])).toThrow(/requires a value/);
    expect(() => parseArgs(["--limit", "zero"])).toThrow(/integer/);
    expect(() => parseArgs(["--limit", "0"])).toThrow(/at least 1/);
    expect(() => parseArgs(["--seed", "-1"])).toThrow(/integer/);
  });

  it("keeps every output path inside docs/audits", () => {
    expect(resolveOutputPath(undefined, 1, 50)).toBe(
      path.join(AUDIT_DIR, "essential-audit-seed-1-limit-50.md")
    );
    expect(resolveOutputPath("nested/sample.md", 1, 50)).toBe(
      path.join(AUDIT_DIR, "nested", "sample.md")
    );
    expect(() => resolveOutputPath("../essential.md", 1, 50)).toThrow(
      /outside/
    );
    expect(() => resolveOutputPath("/tmp/essential.md", 1, 50)).toThrow(
      /outside/
    );
  });
});
