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
  combined?: {
    samples: number;
    uniqueCards: number;
    uniqueFix: number;
    errorRate: number;
    overlapIds: string[];
    overlapAgreement: string;
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
const AUDIT_FILES = ["essential-sample-1.json", "essential-sample-2.json"];

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
  it("recomputes the combined rate and checks overlapping verdicts", () => {
    const merged = new Map<string, "pass" | "fix">();

    for (const { audit } of audits) {
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
