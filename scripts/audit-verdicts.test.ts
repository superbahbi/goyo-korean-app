import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ESSENTIAL_WORDS } from "../client/src/lib/essentialVocabulary";

interface AuditIssue {
  category: string;
  detail: string;
}

interface AuditVerdict {
  id: string;
  source: string;
  verdict: "pass" | "fix";
  issues: AuditIssue[];
  resolvedAt?: string;
  resolution?: string;
}

interface AuditFile {
  sample: number;
  sheet: string;
  seed: number;
  limit: number;
  issueCategories: string[];
  summary: {
    cards: number;
    pass: number;
    fix: number;
    errorRate: number;
    decision: string;
    resolved?: number;
    openFix?: number;
  };
  reaudit?: {
    reauditedAt: string;
    openFixes: number;
    method: string;
    result: string;
  };
  sweep?: {
    batch: number;
    batchSize: number;
    cardsAuditedBefore: number;
    cardsAuditedAfter: number;
    deckCoverage: number;
    remaining: number;
  };
  combined?: {
    samples: number;
    uniqueCards: number;
    uniqueFix: number;
    errorRate: number;
    overlapIds: string[];
    overlapAgreement: string;
  };
  phase7Combined?: {
    samples: number[];
    uniqueCards: number;
    uniqueFix: number;
    uniquePass: number;
    errorRate: number;
    freshCards: number;
    cardsAuditedAcrossPhases: number;
    deckCoverage: number;
    mutualRecheckIds: string[];
    mutualAgreement: string;
  };
  systemicIssues: Array<{
    issue: string;
    category: string;
    cards: number;
    ids: string[];
    detail: string;
  }>;
  verdicts: AuditVerdict[];
}

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const AUDIT_FILES = [
  "essential-sample-1.json",
  "essential-sample-2.json",
  "essential-sample-3.json",
  "essential-sample-4.json",
  "essential-sample-5.json",
];

const audits = AUDIT_FILES.map(file => {
  const audit = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "docs/audits", file), "utf8")
  ) as AuditFile;

  // The verdicts must cover exactly the rows of the committed sheet, so a
  // re-sample that changes the sheet fails until the audit is redone.
  const sheetIds = readFileSync(path.join(REPO_ROOT, audit.sheet), "utf8")
    .split("\n")
    .filter(line => line.startsWith("| essential_"))
    .map(line => line.slice(1, -1).split(" | ")[0].trim());

  return { file, audit, sheetIds };
});

const deck = new Map(ESSENTIAL_WORDS.map(card => [card.id, card]));

for (const { file, audit, sheetIds } of audits) {
  describe(`content audit ${file}`, () => {
    it("has one verdict for every card in the committed sheet", () => {
      expect(audit.verdicts).toHaveLength(audit.limit);
      expect(new Set(audit.verdicts.map(verdict => verdict.id)).size).toBe(
        audit.limit
      );
      expect(audit.verdicts.map(verdict => verdict.id)).toEqual(sheetIds);
    });

    it("only references ids and sources that exist in the imported deck", () => {
      for (const verdict of audit.verdicts) {
        const card = deck.get(verdict.id);
        expect(card, verdict.id).toBeDefined();
        expect(verdict.source, verdict.id).toBe(card!.source);
      }
    });

    it("explains every fix and leaves passes issue-free", () => {
      for (const verdict of audit.verdicts) {
        expect(["pass", "fix"], verdict.id).toContain(verdict.verdict);
        if (verdict.verdict === "fix") {
          expect(verdict.issues.length, verdict.id).toBeGreaterThan(0);
        } else {
          expect(verdict.issues, verdict.id).toEqual([]);
        }

        for (const issue of verdict.issues) {
          expect(audit.issueCategories, verdict.id).toContain(issue.category);
          expect(issue.detail.trim(), verdict.id).not.toBe("");
        }
      }
    });

    it("keeps the summary and systemic counts consistent", () => {
      const fixes = audit.verdicts.filter(
        verdict => verdict.verdict === "fix"
      ).length;

      expect(audit.summary.cards).toBe(audit.verdicts.length);
      expect(audit.summary.fix).toBe(fixes);
      expect(audit.summary.pass).toBe(audit.verdicts.length - fixes);
      expect(audit.summary.errorRate).toBeCloseTo(
        fixes / audit.verdicts.length,
        2
      );

      for (const issue of audit.systemicIssues) {
        expect(issue.cards, issue.issue).toBe(issue.ids.length);
        for (const id of issue.ids)
          expect(deck.has(id), `${issue.issue}: ${id}`).toBe(true);
      }
    });

    it("records the measured rate and the next step", () => {
      expect(audit.seed).toBeGreaterThan(0);
      expect(audit.systemicIssues).toHaveLength(3);
      expect(audit.summary.decision).not.toBe("");

      if (audit.sample === 1)
        expect(audit.summary.decision).toMatch(/second 50/i);
      if (audit.sample === 2)
        expect(audit.summary.decision).toMatch(/scope fixes/i);
    });

    it("resolves every fix and leaves no open verdicts", () => {
      const fixes = audit.verdicts.filter(verdict => verdict.verdict === "fix");

      expect(audit.summary.resolved).toBe(fixes.length);
      expect(audit.summary.openFix).toBe(0);
      expect(audit.reaudit, file).toBeDefined();
      expect(audit.reaudit!.openFixes).toBe(0);
      expect(audit.reaudit!.reauditedAt).not.toBe("");
      expect(audit.reaudit!.method.trim()).not.toBe("");
      expect(audit.reaudit!.result.trim()).not.toBe("");

      for (const verdict of fixes) {
        expect(verdict.resolvedAt, verdict.id).not.toBeUndefined();
        expect(verdict.resolution?.trim(), verdict.id).toBeTruthy();
      }
    });
  });
}

describe("combined audit evidence", () => {
  // Phase 3 only: samples 3-4 re-check some fixed cards, so their verdicts
  // are expected to change from fix to pass.
  const phase3 = audits.filter(({ audit }) => audit.sample <= 2);

  it("recomputes the combined rate and checks overlapping verdicts", () => {
    const merged = new Map<string, "pass" | "fix">();

    for (const { audit } of phase3) {
      for (const verdict of audit.verdicts) {
        const previous = merged.get(verdict.id);
        if (previous !== undefined)
          expect(verdict.verdict, verdict.id).toBe(previous);
        merged.set(verdict.id, verdict.verdict);
      }
    }

    const fixes = [...merged.values()].filter(
      verdict => verdict === "fix"
    ).length;
    const second = audits.find(entry => entry.audit.sample === 2)!.audit;

    expect(second.combined, "sample 2 combined block").toBeDefined();
    expect(second.combined!.samples).toBe(2);
    expect(second.combined!.uniqueCards).toBe(merged.size);
    expect(second.combined!.uniqueFix).toBe(fixes);
    expect(second.combined!.errorRate).toBeCloseTo(fixes / merged.size, 2);
    expect(second.combined!.overlapIds).toHaveLength(4);
    expect(second.combined!.overlapAgreement).toBe("4/4");
  });
});

describe("resolved sample fixes", () => {
  it("keeps the corrected headwords that require new audio", () => {
    expect(deck.get("essential_073")?.front).toBe("오렌지색");
    expect(deck.get("essential_370")?.front).toBe("첫 번째");
  });

  it("keeps the corrected parts of speech", () => {
    const adjectives = [
      "essential_478",
      "essential_487",
      "essential_498",
      "essential_500",
      "essential_504",
      "essential_505",
      "essential_506",
      "essential_516",
      "essential_519",
      "essential_520",
      "essential_525",
    ];

    for (const id of adjectives)
      expect(deck.get(id)?.partOfSpeech, id).toBe("adjective");

    expect(deck.get("essential_350")?.partOfSpeech).toBe("adverb");
    expect(deck.get("essential_370")?.partOfSpeech).toBe("number");
  });
});

describe("phase 7 re-measurement", () => {
  const phase3 = audits.filter(({ audit }) => audit.sample <= 2);
  const recheck = audits.filter(
    ({ audit }) => audit.sample === 3 || audit.sample === 4
  );

  it("samples fresh sheets with seeds beyond the Phase 3 pair", () => {
    expect(recheck.map(({ audit }) => audit.sample)).toEqual([3, 4]);
    expect(new Set(recheck.map(({ audit }) => audit.seed)).size).toBe(2);

    for (const { audit } of recheck) {
      expect(audit.seed, `sample ${audit.sample}`).toBeGreaterThan(2);
      expect(audit.limit).toBe(50);
    }
  });

  it("recomputes the combined rate, fresh cards and rechecked verdicts", () => {
    const allAuditedIds = new Set(
      audits
        .filter(({ audit }) => audit.sample <= 4)
        .flatMap(entry => [...entry.sheetIds])
    );
    const phase3Ids = new Set(phase3.flatMap(entry => [...entry.sheetIds]));
    const merged = new Map<string, "pass" | "fix">();

    for (const { audit } of recheck)
      for (const verdict of audit.verdicts) {
        const previous = merged.get(verdict.id);
        if (previous !== undefined)
          expect(verdict.verdict, verdict.id).toBe(previous);
        merged.set(verdict.id, verdict.verdict);
      }

    const fixes = [...merged.values()].filter(
      verdict => verdict === "fix"
    ).length;
    const fresh = [...merged.keys()].filter(id => !phase3Ids.has(id)).length;

    const [first, second] = recheck.map(
      ({ audit }) =>
        new Map(audit.verdicts.map(verdict => [verdict.id, verdict.verdict]))
    );
    const mutualRecheckIds = [...first.keys()].filter(id => second.has(id));
    const agreed = mutualRecheckIds.filter(
      id => first.get(id) === second.get(id)
    ).length;

    const combined = recheck.find(({ audit }) => audit.sample === 4)!.audit
      .phase7Combined;

    expect(combined, "sample 4 phase7Combined block").toBeDefined();
    expect(combined!.samples).toEqual([3, 4]);
    expect(combined!.uniqueCards).toBe(merged.size);
    expect(combined!.uniqueFix).toBe(fixes);
    expect(combined!.uniquePass).toBe(merged.size - fixes);
    expect(combined!.errorRate).toBeCloseTo(fixes / merged.size, 2);
    expect(combined!.freshCards).toBe(fresh);
    expect(combined!.cardsAuditedAcrossPhases).toBe(allAuditedIds.size);
    expect(combined!.deckCoverage).toBeCloseTo(
      allAuditedIds.size / ESSENTIAL_WORDS.length,
      2
    );
    expect(combined!.mutualRecheckIds).toHaveLength(mutualRecheckIds.length);
    expect(new Set(combined!.mutualRecheckIds)).toEqual(
      new Set(mutualRecheckIds)
    );
    expect(combined!.mutualAgreement).toBe(
      `${agreed}/${mutualRecheckIds.length}`
    );
  });
});

describe("phase 7 sweep", () => {
  const priorIds = new Set(
    audits
      .filter(({ audit }) => audit.sample <= 4)
      .flatMap(entry => [...entry.sheetIds])
  );
  const sweep = audits.filter(({ audit }) => audit.sample >= 5);

  it("audits only cards that had no verdict before the batch", () => {
    expect(sweep.length).toBeGreaterThan(0);

    for (const { audit } of sweep) {
      expect(audit.limit, `sample ${audit.sample}`).toBe(50);
      for (const verdict of audit.verdicts)
        expect(priorIds.has(verdict.id), verdict.id).toBe(false);
    }
  });

  it("records the deck coverage after each batch", () => {
    let audited = priorIds.size;

    for (const { audit, sheetIds } of sweep) {
      const auditedAfter = audited + sheetIds.length;

      expect(audit.sweep, `sample ${audit.sample} sweep block`).toBeDefined();
      expect(audit.sweep!.cardsAuditedBefore).toBe(audited);
      expect(audit.sweep!.cardsAuditedAfter).toBe(auditedAfter);
      expect(audit.sweep!.remaining).toBe(
        ESSENTIAL_WORDS.length - auditedAfter
      );
      expect(audit.sweep!.deckCoverage).toBeCloseTo(
        auditedAfter / ESSENTIAL_WORDS.length,
        2
      );
      audited = auditedAfter;
    }
  });
});
