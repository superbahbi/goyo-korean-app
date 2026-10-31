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
}

interface AuditFile {
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
const audit = JSON.parse(
  readFileSync(
    path.join(REPO_ROOT, "docs/audits/essential-sample-1.json"),
    "utf8"
  )
) as AuditFile;

// The verdicts must cover exactly the rows of the committed sheet, so a
// re-sample that changes the sheet fails until the audit is redone.
const sheetIds = readFileSync(path.join(REPO_ROOT, audit.sheet), "utf8")
  .split("\n")
  .filter(line => line.startsWith("| essential_"))
  .map(line => line.slice(1, -1).split(" | ")[0].trim());

const deck = new Map(ESSENTIAL_WORDS.map(card => [card.id, card]));

describe("baseline content audit", () => {
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
    expect(audit.seed).toBe(1);
    expect(audit.systemicIssues).toHaveLength(3);
    expect(audit.summary.decision).toMatch(/audit a second 50/i);
  });
});
